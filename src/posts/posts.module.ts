import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { Post } from '../entities/post.entity';
import { Comment } from '../entities/comment.entity';
import { Notification } from '../entities/notification.entity';
import { User } from '../entities/user.entity';
import { Ad } from '../entities/ad.entity';
import { NotBlockedGuard } from '../common/guards/not-blocked.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Post,
      Comment,
      Notification,
      User,
      Ad,
    ]),
  ],
  controllers: [PostsController],
  providers: [PostsService, NotBlockedGuard],
  exports: [PostsService],
})
export class PostsModule {}
