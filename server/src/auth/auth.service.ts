import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from '../db/database.service';
import bcrypt from 'bcryptjs';

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
  constructor(private readonly dbService: DatabaseService) {}

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

    // 1. Create User
    await new Promise<void>((resolve, reject) => {
        db.run('INSERT INTO users (email, password_hash, is_verified, created_at) VALUES (?, ?, 0, ?)',
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

    console.log(`[VERIFICATION CODE] ${normEmail}: ${code}`);
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

    db.run('UPDATE users SET is_verified = 1 WHERE email = ?', [normEmail]);
    db.run('DELETE FROM user_verifications WHERE email = ?', [normEmail]);
    
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

    console.log(`[PASSWORD RESET CODE] ${normEmail}: ${code}`);
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
