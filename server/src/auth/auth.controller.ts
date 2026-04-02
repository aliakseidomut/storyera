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
    if (password !== confirmPassword) throw new Error('Passwords do not match');
    if (!agreed) throw new Error('You must agree to the Terms of Service');
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

  /* ──── Admin stories CRUD (simple password gate) ─── */
  private checkAdminPassword(pass?: string) {
    if (pass !== '1209348756') {
      throw new UnauthorizedException('Invalid admin password');
    }
  }

  @Post('story-create')
  async storyCreate(@Body() body: any) {
    this.checkAdminPassword(body?.password);
    return this.authService.createStory(body?.story || {});
  }

  @Post('story-update')
  async storyUpdate(@Body() body: any) {
    this.checkAdminPassword(body?.password);
    if (!body?.id) throw new UnauthorizedException('Missing story id');
    return this.authService.updateStory(Number(body.id), body?.story || {});
  }

  @Post('story-delete')
  async storyDelete(@Body() body: any) {
    this.checkAdminPassword(body?.password);
    if (!body?.id) throw new UnauthorizedException('Missing story id');
    return this.authService.deleteStory(Number(body.id));
  }

  /* ──── Progress (language-aware) ──── */

  @Post('all-progress')
  async getAllProgress(@Body() body: { user_id?: number; email?: string }) {
    const userId = await this.resolveUserId(body);
    return this.authService.getAllProgress(userId);
  }

  @Post('save-progress')
  async saveProgress(@Body() body: any) {
    const userId = await this.resolveUserId(body);
    return this.authService.saveProgress(userId, body.story_id, body.progress);
  }

  @Post('get-progress')
  async getProgress(@Body() body: { user_id?: number; email?: string; story_id: number; language?: string }) {
    const userId = await this.resolveUserId(body);
    if (!userId) throw new UnauthorizedException('Could not resolve user identity');
    return this.authService.getProgress(userId, body.story_id, body.language);
  }

  @Post('clear-progress')
  async clearProgress(@Body() body: { user_id?: number; email?: string; story_id: number; language?: string }) {
    const userId = await this.resolveUserId(body);
    return this.authService.clearProgress(userId, body.story_id, body.language);
  }

  /* ──── Bookmarks ──── */

  @Post('all-bookmarks')
  async getAllBookmarks(@Body() body: { user_id?: number; email?: string }) {
    const userId = await this.resolveUserId(body);
    return this.authService.getAllBookmarks(userId);
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

  /* ──── Completed stories ──── */

  @Post('save-completed')
  async saveCompleted(@Body() body: { user_id?: number; email?: string; story_id: number; language?: string; title: string; chat_history: string }) {
    const userId = await this.resolveUserId(body);
    return this.authService.saveCompleted(userId, body.story_id, body.language || 'ru', body.title, body.chat_history);
  }

  @Post('all-completed')
  async getAllCompleted(@Body() body: { user_id?: number; email?: string }) {
    const userId = await this.resolveUserId(body);
    return this.authService.getCompletedStories(userId);
  }

  @Post('get-completed')
  async getCompleted(@Body() body: { user_id?: number; email?: string; completed_id: number }) {
    const userId = await this.resolveUserId(body);
    return this.authService.getCompletedStoryById(userId, body.completed_id);
  }

  /* ──── Auth ──── */

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
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
    };
  }
}
