import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { DatabaseService } from '../db/database.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, DatabaseService],
})
export class AuthModule {}

