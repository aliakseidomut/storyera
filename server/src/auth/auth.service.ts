import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from '../db/database.service';
import bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';

export interface UserRecord {
  id: number;
  email: string;
  password_hash: string;
  created_at: string;
  is_premium?: number;
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

    // 1. Store in pending_users
    await new Promise<void>((resolve, reject) => {
        db.run('INSERT OR REPLACE INTO pending_users (email, password_hash, created_at) VALUES (?, ?, ?)',
            [normEmail, passwordHash, createdAt],
            (err) => err ? reject(err) : resolve()
        );
    });

    // 2. Create Verification
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
    
    // Check code
    const row = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM user_verifications WHERE email = ?', [normEmail], (err, row) => err ? reject(err) : resolve(row));
    });

    if (!row || (row as any).code !== code) throw new UnauthorizedException('Invalid verification code');
    if (new Date((row as any).expires_at) < new Date()) throw new UnauthorizedException('Code expired');

    // Move from pending_users to users
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
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return {
      id: user.id,
      email: user.email,
      createdAt: user.created_at,
      is_premium: user.is_premium,
      is_verified: user.is_verified
    };
  }

  async updatePremium(email: string) {
    const db = this.dbService.getDatabase();
    return new Promise((resolve, reject) => {
      db.run('UPDATE users SET is_premium = 1 WHERE email = ?', [email.trim().toLowerCase()], function(err) {
        if (err) {
            console.error('Update error:', err);
            return reject(err);
        }
        resolve(this.changes > 0);
      });
    });
  }

  async resendCode(email: string) {
    const db = this.dbService.getDatabase();
    const normEmail = email.trim().toLowerCase();
    
    // Check if user exists
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

  async saveProgress(user_id: number, story_id: number, progress: any) {
    const db = this.dbService.getDatabase();
    const { chat_history, story_state, choices_count, last_scene_summary, last_user_choice } = progress;
    const updatedAt = new Date().toISOString();

    return new Promise<void>((resolve, reject) => {
      db.run(`INSERT OR REPLACE INTO user_story_progress 
        (user_id, story_id, chat_history, story_state, choices_count, last_scene_summary, last_user_choice, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [user_id, story_id, JSON.stringify(chat_history), JSON.stringify(story_state), choices_count, last_scene_summary, last_user_choice, updatedAt],
        (err) => err ? reject(err) : resolve()
      );
    });
  }

  async getStories() {
    const db = this.dbService.getDatabase();
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM stories', [], (err, rows) => err ? reject(err) : resolve(rows));
    });
  }

  async getAllProgress(user_id: number) {
    const db = this.dbService.getDatabase();
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM user_story_progress WHERE user_id = ?', [user_id], (err, rows) => err ? reject(err) : resolve(rows));
    });
  }

  async getProgress(user_id: number, story_id: number) {
    const db = this.dbService.getDatabase();
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM user_story_progress WHERE user_id = ? AND story_id = ?', 
        [user_id, story_id], (err, row) => err ? reject(err) : resolve(row));
    });
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
