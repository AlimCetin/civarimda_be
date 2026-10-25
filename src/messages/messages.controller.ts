import { Controller, Get, Post, Param, Body, Put, Query, UseGuards, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { User } from '../entities/user.entity';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Get('conversations')
  async getConversations(
    @CurrentUser() user: User,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.messagesService.getConversations(user.id, page, limit);
  }

  @Get(':conversationId')
  async getMessages(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: User,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.messagesService.getMessages(conversationId, user.id, page, limit);
  }

  @Post()
  async sendMessage(@Body() body: { receiverId: string; text: string }, @CurrentUser() user: User) {
    return this.messagesService.sendMessage(user.id, body.receiverId, body.text);
  }

  @Put(':conversationId/read')
  async markAsRead(@Param('conversationId') conversationId: string, @CurrentUser() user: User) {
    const result = await this.messagesService.markAsRead(conversationId, user.id);
    return { message: 'Marked as read', modifiedCount: result.modifiedCount };
  }

  @Get('unread/count')
  async getUnreadCount(@CurrentUser() user: User) {
    const count = await this.messagesService.getUnreadMessagesCount(user.id);
    return { count };
  }
}

