import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

class AuthDto {
  email!: string;
  password!: string;
}

@Controller('api')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: AuthDto) {
    const { email, password } = body;
    return this.authService.register(email, password);
  }

  @Post('login')
  async login(@Body() body: AuthDto) {
    const { email, password } = body;
    return this.authService.login(email, password);
  }
}

