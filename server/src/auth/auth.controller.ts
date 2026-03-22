import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

class AuthDto {
  email!: string;
  password!: string;
  confirmPassword?: string;
  agreed?: boolean;
}

@Controller('api')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: AuthDto) {
    const { email, password, confirmPassword, agreed } = body;
    if (password !== confirmPassword) {
      throw new Error('Passwords do not match');
    }
    if (!agreed) {
      throw new Error('You must agree to the Terms of Service');
    }
    return this.authService.register(email, password);
  }

  @Post('verify')
  async verify(@Body() body: { email: string; code: string }) {
    return this.authService.verify(body.email, body.code);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { email: string; code: string; password: string }) {
    return this.authService.resetPassword(body.email, body.code, body.password);
  }

  @Post('login')
  async login(@Body() body: AuthDto) {
    const { email, password } = body;
    const user = await this.authService.login(email, password);
    if (!user.is_verified) {
      throw new UnauthorizedException('Please verify your email first');
    }
    return user;
  }

  @Post('me')
  async me(@Body() body: { email: string }) {
    const user = await this.authService.findUserByEmail(body.email);
    return { isPremium: user?.is_premium || false };
  }

  // Payments are temporarily disabled.
  // @Post('create-checkout-session')
  // async createCheckoutSession(@Body() body: { email: string }) {
  //   return { message: 'Payments are temporarily disabled' };
  // }

  // @Post('verify-payment')
  // async verifyPayment(@Body() body: { session_id: string; email: string }) {
  //   return { message: 'Payments are temporarily disabled' };
  // }
}
