import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import Stripe from 'stripe';

const stripeKey = process.env.STRIPE_KEY;
if (!stripeKey) {
  // Do not start Stripe if key is missing; endpoints depending on it will throw clearly
  // eslint-disable-next-line no-console
  console.error('Missing STRIPE_KEY in environment. Stripe checkout endpoints will fail until it is set.');
}
const stripe = stripeKey
  ? new Stripe(stripeKey, { apiVersion: '2024-06-20' as any })
  : (null as unknown as Stripe);

class AuthDto {
  email!: string;
  password!: string;
  confirmPassword?: string;
  agreed?: boolean;
}

@Controller('api')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private async resolveUserId(body: { user_id?: number; email?: string }) {
    if (body?.user_id) return body.user_id;
    const resolved = await this.authService.resolveUserIdByEmail(body?.email, true);
    if (!resolved) {
      throw new UnauthorizedException('Missing or invalid user identity');
    }
    return resolved;
  }

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

  @Post('stories')
  async getStories() {
    return this.authService.getStories();
  }

  @Post('all-progress')
  async getAllProgress(@Body() body: { user_id?: number; email?: string }) {
    const userId = await this.resolveUserId(body);
    return this.authService.getAllProgress(userId);
  }

  @Post('all-bookmarks')
  async getAllBookmarks(@Body() body: { user_id?: number; email?: string }) {
    const userId = await this.resolveUserId(body);
    return this.authService.getAllBookmarks(userId);
  }

  @Post('save-progress')
  async saveProgress(@Body() body: any) {
    const userId = await this.resolveUserId(body);
    return this.authService.saveProgress(userId, body.story_id, body.progress);
  }

  @Post('get-progress')
  async getProgress(@Body() body: { user_id?: number; email?: string; story_id: number }) {
    const userId = await this.resolveUserId(body);
    return this.authService.getProgress(userId, body.story_id);
  }

  @Post('clear-progress')
  async clearProgress(@Body() body: { user_id?: number; email?: string; story_id: number }) {
    const userId = await this.resolveUserId(body);
    return this.authService.clearProgress(userId, body.story_id);
  }

  @Post('bookmark')
  async addBookmark(@Body() body: { user_id?: number; email?: string; story_id: number }) {
    const userId = await this.resolveUserId(body);
    return this.authService.addBookmark(userId, body.story_id);
  }

  @Post('unbookmark')
  async removeBookmark(@Body() body: { user_id?: number; email?: string; story_id: number }) {
    const userId = await this.resolveUserId(body);
    return this.authService.removeBookmark(userId, body.story_id);
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
    if (!stripeKey || !stripe) {
      throw new Error('Stripe is not configured. Please set STRIPE_KEY in .env');
    }
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
    if (!stripeKey || !stripe) {
      throw new Error('Stripe is not configured. Please set STRIPE_KEY in .env');
    }
    const session = await stripe.checkout.sessions.retrieve(body.session_id);
    if (session.payment_status === 'paid') {
      await this.authService.updatePremium(body.email);
      return { success: true };
    }
    throw new Error('Payment not completed');
  }
}
