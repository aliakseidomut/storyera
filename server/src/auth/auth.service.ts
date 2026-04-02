import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from '../db/database.service';
import bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';

export interface UserRecord {
  id: number;
  email: string;
  password_hash: string;
  created_at: string;
  is_verified?: number;
}

@Injectable()
export class AuthService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly dbService: DatabaseService) {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
      auth: {
        user: 'resend',
        pass: process.env.RESEND_API_KEY,
      },
    });
  }

  async sendVerificationEmail(email: string, code: string) {
    try {
      await this.transporter.sendMail({
        from: 'onboarding@resend.dev',
        to: email,
        subject: 'Verification Code for Storyera',
        text: `Your verification code is: ${code}`,
        html: `<p>Your verification code is: <strong>${code}</strong></p>`,
      });
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  }

  async register(email: string, password: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) throw new Error('Invalid email format');

    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;
    if (!passwordRegex.test(password)) {
      throw new Error('Password must be 8+ chars with at least 1 digit and 1 special character');
    }

    const db = this.dbService.getDatabase();
    const normEmail = (email || '').trim().toLowerCase();
    const passwordHash = bcrypt.hashSync(password, 10);
    const createdAt = new Date().toISOString();

    const existing = await this.findUserByEmail(normEmail);
    if (existing) throw new ConflictException('User with this email already exists');

    await new Promise<void>((resolve, reject) => {
      db.run('INSERT OR REPLACE INTO pending_users (email, password_hash, created_at) VALUES (?, ?, ?)',
        [normEmail, passwordHash, createdAt],
        (err) => err ? reject(err) : resolve()
      );
    });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60000).toISOString();
    await new Promise<void>((resolve, reject) => {
      db.run('INSERT OR REPLACE INTO user_verifications (email, code, expires_at) VALUES (?, ?, ?)',
        [normEmail, code, expiresAt], (err) => err ? reject(err) : resolve());
    });

    await this.sendVerificationEmail(normEmail, code);
    return { message: 'Verification code sent to your email' };
  }

  async verify(email: string, code: string) {
    const db = this.dbService.getDatabase();
    const normEmail = email.trim().toLowerCase();

    const row = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM user_verifications WHERE email = ?', [normEmail], (err, row) => err ? reject(err) : resolve(row));
    });

    if (!row || (row as any).code !== code) throw new UnauthorizedException('Invalid verification code');
    if (new Date((row as any).expires_at) < new Date()) throw new UnauthorizedException('Code expired');

    const pending = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM pending_users WHERE email = ?', [normEmail], (err, row) => err ? reject(err) : resolve(row));
    });

    if (!pending) throw new UnauthorizedException('Registration data not found');

    await new Promise<void>((resolve, reject) => {
      db.run('INSERT INTO users (email, password_hash, is_verified, created_at) VALUES (?, ?, 1, ?)',
        [(pending as any).email, (pending as any).password_hash, (pending as any).created_at],
        (err) => err ? reject(err) : resolve()
      );
    });

    db.run('DELETE FROM user_verifications WHERE email = ?', [normEmail]);
    db.run('DELETE FROM pending_users WHERE email = ?', [normEmail]);

    return { message: 'Verified' };
  }

  async forgotPassword(email: string) {
    const db = this.dbService.getDatabase();
    const normEmail = email.trim().toLowerCase();
    const user = await this.findUserByEmail(normEmail);
    if (!user) throw new UnauthorizedException('User not found');

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60000).toISOString();

    await new Promise<void>((resolve, reject) => {
      db.run('INSERT OR REPLACE INTO user_verifications (email, code, expires_at) VALUES (?, ?, ?)',
        [normEmail, code, expiresAt], (err) => err ? reject(err) : resolve());
    });

    await this.sendVerificationEmail(normEmail, code);
    return { message: 'Reset code sent' };
  }

  async resetPassword(email: string, code: string, password: string) {
    const db = this.dbService.getDatabase();
    const normEmail = email.trim().toLowerCase();
    const row = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM user_verifications WHERE email = ?', [normEmail], (err, row) => err ? reject(err) : resolve(row));
    });

    if (!row || (row as any).code !== code) throw new UnauthorizedException('Invalid code');
    if (new Date((row as any).expires_at) < new Date()) throw new UnauthorizedException('Code expired');

    const passwordHash = bcrypt.hashSync(password, 10);
    await new Promise<void>((resolve, reject) => {
      db.run('UPDATE users SET password_hash = ? WHERE email = ?', [passwordHash, normEmail], (err) => err ? reject(err) : resolve());
    });

    db.run('DELETE FROM user_verifications WHERE email = ?', [normEmail]);
    return { message: 'Password updated' };
  }

  async login(email: string, password: string) {
    const normEmail = (email || '').trim().toLowerCase();
    const user = await this.findUserByEmail(normEmail);
    if (!user) throw new UnauthorizedException('Invalid email or password');

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) throw new UnauthorizedException('Invalid email or password');

    return {
      id: user.id,
      email: user.email,
      createdAt: user.created_at,
      is_verified: user.is_verified
    };
  }

  async resendCode(email: string) {
    const db = this.dbService.getDatabase();
    const normEmail = email.trim().toLowerCase();

    const user = await this.findUserByEmail(normEmail);
    if (!user) throw new UnauthorizedException('User not found');

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60000).toISOString();

    await new Promise<void>((resolve, reject) => {
      db.run('INSERT OR REPLACE INTO user_verifications (email, code, expires_at) VALUES (?, ?, ?)',
        [normEmail, code, expiresAt], (err) => err ? reject(err) : resolve());
    });

    await this.sendVerificationEmail(normEmail, code);
    return { message: 'Verification code resent' };
  }

  /* ──────────────── PROGRESS (language-aware) ──────────────── */

  async saveProgress(user_id: number, story_id: number, progress: any) {
    if (!user_id || !story_id || !progress) {
      throw new UnauthorizedException('Invalid progress payload');
    }

    const db = this.dbService.getDatabase();
    const { chat_history, story_state, choices_count, last_scene_summary, last_user_choice, language } = progress;
    const lang = language || 'ru';
    const updatedAt = new Date().toISOString();

    return new Promise<{ success: boolean }>((resolve, reject) => {
      db.run(`INSERT OR REPLACE INTO user_story_progress
        (user_id, story_id, language, chat_history, story_state, choices_count, last_scene_summary, last_user_choice, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [user_id, story_id, lang, JSON.stringify(chat_history), JSON.stringify(story_state), choices_count, last_scene_summary, last_user_choice, updatedAt],
        (err) => err ? reject(err) : resolve({ success: true })
      );
    });
  }

  async getProgress(user_id: number, story_id: number, language?: string) {
    if (!user_id || !story_id) {
      throw new UnauthorizedException('Missing user id or story id');
    }

    const db = this.dbService.getDatabase();
    const lang = language || 'ru';
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM user_story_progress WHERE user_id = ? AND story_id = ? AND language = ?',
        [user_id, story_id, lang], (err, row) => err ? reject(err) : resolve(row || null));
    });
  }

  async getAllProgress(user_id: number) {
    if (!user_id) {
      throw new UnauthorizedException('Missing user id');
    }

    const db = this.dbService.getDatabase();
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM user_story_progress WHERE user_id = ?', [user_id], (err, rows) => err ? reject(err) : resolve(rows));
    });
  }

  async clearProgress(user_id: number, story_id: number, language?: string) {
    if (!user_id || !story_id) {
      throw new UnauthorizedException('Missing user id or story id');
    }

    const db = this.dbService.getDatabase();
    const lang = language || 'ru';
    return new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM user_story_progress WHERE user_id = ? AND story_id = ? AND language = ?',
        [user_id, story_id, lang],
        function (err) {
          if (err) return reject(err);
          resolve({ success: true, deleted: this.changes > 0 });
        },
      );
    });
  }

  /* ──────────────── STORIES ──────────────── */

  async getStories() {
    const db = this.dbService.getDatabase();
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM stories', [], (err, rows) => err ? reject(err) : resolve(rows));
    });
  }

  async createStory(payload: any) {
    const db = this.dbService.getDatabase();
    const now = new Date().toISOString();
    const {
      title, description, category, tags = [], image = '',
      rating = 5.0, plays = 0, mature = 1,
      protagonist = {}, characters = [], plot = {}, translations = {}
    } = payload || {};
    return new Promise<{ success: boolean; id: number }>((resolve, reject) => {
      db.run(
        `INSERT INTO stories (title, description, category, tags_json, image, rating, plays, mature, created_at, protagonist_json, characters_json, plot_json, translations_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          title, description, category, JSON.stringify(tags), image, rating, plays, mature, now,
          JSON.stringify(protagonist), JSON.stringify(characters), JSON.stringify(plot), JSON.stringify(translations)
        ],
        function (err) {
          if (err) return reject(err);
          resolve({ success: true, id: this.lastID });
        }
      );
    });
  }

  async updateStory(id: number, payload: any) {
    const db = this.dbService.getDatabase();
    const {
      title, description, category, tags = [], image = '',
      rating = 5.0, plays = 0, mature = 1,
      protagonist = {}, characters = [], plot = {}, translations = {}
    } = payload || {};
    return new Promise<{ success: boolean }>((resolve, reject) => {
      db.run(
        `UPDATE stories SET title = ?, description = ?, category = ?, tags_json = ?, image = ?, rating = ?, plays = ?, mature = ?, protagonist_json = ?, characters_json = ?, plot_json = ?, translations_json = ? WHERE id = ?`,
        [
          title, description, category, JSON.stringify(tags), image, rating, plays, mature,
          JSON.stringify(protagonist), JSON.stringify(characters), JSON.stringify(plot), JSON.stringify(translations),
          id
        ],
        function (err) {
          if (err) return reject(err);
          resolve({ success: true });
        }
      );
    });
  }

  async deleteStory(id: number) {
    const db = this.dbService.getDatabase();
    return new Promise<{ success: boolean }>((resolve, reject) => {
      db.run(`DELETE FROM stories WHERE id = ?`, [id], function (err) {
        if (err) return reject(err);
        resolve({ success: true });
      });
    });
  }

  /* ──────────────── BOOKMARKS ──────────────── */

  async addBookmark(user_id: number, story_id: number) {
    if (!user_id || !story_id) throw new UnauthorizedException('Missing user id or story id');

    const db = this.dbService.getDatabase();
    const createdAt = new Date().toISOString();
    return new Promise<{ success: boolean }>((resolve, reject) => {
      db.run(
        'INSERT OR REPLACE INTO user_bookmarks (user_id, story_id, created_at) VALUES (?, ?, ?)',
        [user_id, story_id, createdAt],
        (err) => (err ? reject(err) : resolve({ success: true })),
      );
    });
  }

  async removeBookmark(user_id: number, story_id: number) {
    if (!user_id || !story_id) throw new UnauthorizedException('Missing user id or story id');

    const db = this.dbService.getDatabase();
    return new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM user_bookmarks WHERE user_id = ? AND story_id = ?',
        [user_id, story_id],
        function (err) {
          if (err) return reject(err);
          resolve({ success: true, deleted: this.changes > 0 });
        },
      );
    });
  }

  async getAllBookmarks(user_id: number) {
    if (!user_id) throw new UnauthorizedException('Missing user id');

    const db = this.dbService.getDatabase();
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM user_bookmarks WHERE user_id = ? ORDER BY created_at DESC',
        [user_id],
        (err, rows) => (err ? reject(err) : resolve(rows)),
      );
    });
  }

  /* ──────────────── COMPLETED STORIES ──────────────── */

  async saveCompleted(user_id: number, story_id: number, language: string, title: string, chat_history: string) {
    if (!user_id || !story_id) throw new UnauthorizedException('Missing user id or story id');

    const db = this.dbService.getDatabase();
    const lang = language || 'ru';

    // Determine next version number
    const existingCount: number = await new Promise((resolve, reject) => {
      db.get(
        'SELECT COUNT(*) as cnt FROM completed_stories WHERE user_id = ? AND story_id = ? AND language = ?',
        [user_id, story_id, lang],
        (err, row: any) => err ? reject(err) : resolve(row?.cnt || 0),
      );
    });
    const nextVersion = existingCount + 1;

    return new Promise<{ success: boolean; id: number; version: number }>((resolve, reject) => {
      db.run(
        `INSERT INTO completed_stories (user_id, story_id, language, version, title, chat_history, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [user_id, story_id, lang, nextVersion, title, chat_history, new Date().toISOString()],
        function (err) {
          if (err) return reject(err);
          resolve({ success: true, id: this.lastID, version: nextVersion });
        },
      );
    });
  }

  async getCompletedStories(user_id: number) {
    if (!user_id) throw new UnauthorizedException('Missing user id');

    const db = this.dbService.getDatabase();
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT id, user_id, story_id, language, version, title, completed_at FROM completed_stories WHERE user_id = ? ORDER BY completed_at DESC',
        [user_id],
        (err, rows) => (err ? reject(err) : resolve(rows)),
      );
    });
  }

  async getCompletedStoryById(user_id: number, completed_id: number) {
    if (!user_id || !completed_id) throw new UnauthorizedException('Missing ids');

    const db = this.dbService.getDatabase();
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM completed_stories WHERE user_id = ? AND id = ?',
        [user_id, completed_id],
        (err, row) => (err ? reject(err) : resolve(row || null)),
      );
    });
  }

  /* ──────────────── USER LOOKUP ──────────────── */

  async resolveUserIdByEmail(email?: string, createIfMissing = false): Promise<number | null> {
    if (!email) return null;
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await this.findUserByEmail(normalizedEmail);
    if (existing?.id) return existing.id;
    if (!createIfMissing) return null;

    const db = this.dbService.getDatabase();
    const placeholderHash = bcrypt.hashSync(`oauth:${normalizedEmail}`, 10);
    const createdAt = new Date().toISOString();

    await new Promise<void>((resolve, reject) => {
      db.run(
        'INSERT OR IGNORE INTO users (email, password_hash, is_verified, created_at) VALUES (?, ?, 1, ?)',
        [normalizedEmail, placeholderHash, createdAt],
        (err) => (err ? reject(err) : resolve()),
      );
    });

    const created = await this.findUserByEmail(normalizedEmail);
    return created?.id ?? null;
  }

  async findUserByEmail(email: string): Promise<UserRecord | null> {
    const db = this.dbService.getDatabase();
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()], (err, row) => {
        if (err) return reject(err);
        resolve((row as UserRecord) || null);
      });
    });
  }
}
