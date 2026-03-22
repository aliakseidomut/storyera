import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import Stripe from 'stripe';

const stripe = new Stripe('STRIPE_KEY_REDACTED', {
  apiVersion: '2024-06-20' as any,
});

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

  @Post('create-checkout-session')
  async createCheckoutSession(@Body() body: { email: string }) {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { 
            name: 'Premium Storyera',
            description: 'Premium subscription for Storyera store'
          },
          unit_amount: 990,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: 'https://storiera.run.place/success?session_id={CHECKOUT_SESSION_ID}&email=' + encodeURIComponent(body.email),
      cancel_url: 'https://storiera.run.place/cancel',
    });
    return { url: session.url };
  }

  @Post('verify-payment')
  async verifyPayment(@Body() body: { session_id: string; email: string }) {
    const session = await stripe.checkout.sessions.retrieve(body.session_id);
    if (session.payment_status === 'paid') {
      await this.authService.updatePremium(body.email);
      return { success: true };
    }
    throw new Error('Payment not completed');
  }
}
