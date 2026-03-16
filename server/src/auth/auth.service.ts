import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from '../db/database.service';
import bcrypt from 'bcryptjs';

export interface UserRecord {
  id: number;
  email: string;
  password_hash: string;
  created_at: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly dbService: DatabaseService) {}

  async register(email: string, password: string) {
    const db = this.dbService.getDatabase();
    const normEmail = (email || '').trim().toLowerCase();
    const passwordHash = bcrypt.hashSync(password, 10);
    const createdAt = new Date().toISOString();

    const existing = await this.findUserByEmail(normEmail);
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const stmt = db.prepare(
      'INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)',
    );

    const userId = await new Promise<number>((resolve, reject) => {
      stmt.run(normEmail, passwordHash, createdAt, function (err) {
        if (err) {
          return reject(err);
        }
        resolve(this.lastID as number);
      });
    });

    return {
      id: userId,
      email: normEmail,
      createdAt,
    };
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
    };
  }

  private async findUserByEmail(email: string): Promise<UserRecord | null> {
    const db = this.dbService.getDatabase();
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) return reject(err);
        resolve((row as UserRecord) || null);
      });
    });
  }
}

