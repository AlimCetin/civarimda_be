import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { FeedbackStatus, FeedbackType } from '../entities/feedback.entity';
import { CurrentUser } from '../common/decorators/user.decorator';
import { User } from '../entities/user.entity';

@Controller()
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  /**
   * Mobil uygulamadan kullanıcı değerlendirmesi (yıldız puanı), öneri veya hata bildirimi gönderme.
   * Kimlik doğrulama isteğe bağlıdır; giriş yapmış kullanıcının bilgileri otomatik iliştirilir.
   */
  @Post('feedback')
  async submitFeedback(
    @Body()
    body: {
      rating?: number;
      type?: FeedbackType;
      title?: string;
      message: string;
      deviceInfo?: string;
      userName?: string;
      userEmail?: string;
    },
    @Req() req: any,
  ) {
    const userId = req.user?.id || null;
    const userName = req.user?.fullName || body.userName || 'Kullanıcı';
    const userEmail = req.user?.email || body.userEmail || '';

    return this.feedbackService.create({
      userId,
      userName,
      userEmail,
      rating: body.rating,
      type: body.type,
      title: body.title,
      message: body.message,
      deviceInfo: body.deviceInfo,
    });
  }

  /**
   * Admin paneli için geri bildirim ve öneri listesi.
   */
  @Get('admin/feedback')
  @UseGuards(JwtAuthGuard)
  async getFeedbacks(
    @Query('status') status?: string,
    @Query('type') type?: string,
    @CurrentUser() user?: User,
  ) {
    if (user && !['admin', 'super_admin', 'moderator'].includes(user.role)) {
      throw new ForbiddenException('Yetkisiz erişim');
    }
    return this.feedbackService.findAll(
      status as FeedbackStatus,
      type as FeedbackType,
    );
  }

  /**
   * Admin paneli geri bildirim istatistikleri.
   */
  @Get('admin/feedback/stats')
  @UseGuards(JwtAuthGuard)
  async getFeedbackStats(@CurrentUser() user?: User) {
    if (user && !['admin', 'super_admin', 'moderator'].includes(user.role)) {
      throw new ForbiddenException('Yetkisiz erişim');
    }
    return this.feedbackService.getStats();
  }

  /**
   * Admin tarafından geri bildirim durumunun güncellenmesi (ör: reviewed, resolved).
   */
  @Patch('admin/feedback/:id/status')
  @UseGuards(JwtAuthGuard)
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; adminNote?: string },
    @CurrentUser() user?: User,
  ) {
    if (user && !['admin', 'super_admin', 'moderator'].includes(user.role)) {
      throw new ForbiddenException('Yetkisiz erişim');
    }
    return this.feedbackService.updateStatus(
      id,
      body.status as FeedbackStatus,
      body.adminNote,
    );
  }
}
