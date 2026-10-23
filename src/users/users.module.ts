import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from '../entities/user.entity';
import { UserCredentials } from '../entities/user-credentials.entity';
import { Post } from '../entities/post.entity';
import { Comment } from '../entities/comment.entity';
import { Conversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';
import { Notification } from '../entities/notification.entity';
import { NotBlockedGuard } from '../common/guards/not-blocked.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserCredentials,
      Post,
      Comment,
      Conversation,
      Message,
      Notification,
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService, NotBlockedGuard],
  exports: [UsersService],
})
export class UsersModule {}
