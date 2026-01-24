import { Controller, Get, Put, Param, Query, UseGuards, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { User } from '../entities/user.entity';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get('unread/count')
  async getUnreadCount(@CurrentUser() user: User) {
    const count = await this.notificationsService.getUnreadCount(user._id.toString());
    return { count };
  }

  @Get()
  async getNotifications(
    @CurrentUser() user: User,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.notificationsService.getUserNotifications(user._id.toString(), page, limit);
  }

  @Put(':id/read')
  async markAsRead(@Param('id') id: string, @CurrentUser() user: User) {
    await this.notificationsService.markAsRead(id, user._id.toString());
    return { message: 'Marked as read' };
  }

  @Put('read-all')
  async markAllAsRead(@CurrentUser() user: User) {
    await this.notificationsService.markAllAsRead(user._id.toString());
    return { message: 'All marked as read' };
  }
}

