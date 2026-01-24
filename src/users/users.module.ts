import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User, UserSchema } from '../entities/user.entity';
import { UserCredentials, UserCredentialsSchema } from '../entities/user-credentials.entity';
import { Post, PostSchema } from '../entities/post.entity';
import { Comment, CommentSchema } from '../entities/comment.entity';
import { Conversation, ConversationSchema } from '../entities/conversation.entity';
import { Message, MessageSchema } from '../entities/message.entity';
import { Notification, NotificationSchema } from '../entities/notification.entity';
import { NotBlockedGuard } from '../common/guards/not-blocked.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserCredentials.name, schema: UserCredentialsSchema },
      { name: Post.name, schema: PostSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService, NotBlockedGuard],
  exports: [UsersService],
})
export class UsersModule {}
