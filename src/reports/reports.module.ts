import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Report, ReportSchema } from '../entities/report.entity';
import { Post, PostSchema } from '../entities/post.entity';
import { User, UserSchema } from '../entities/user.entity';
import { Comment, CommentSchema } from '../entities/comment.entity';
import { Message, MessageSchema } from '../entities/message.entity';
import { ModeratorGuard } from '../common/guards/moderator.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Report.name, schema: ReportSchema },
      { name: Post.name, schema: PostSchema },
      { name: User.name, schema: UserSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: Message.name, schema: MessageSchema },
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService, ModeratorGuard],
  exports: [ReportsService],
})
export class ReportsModule {}

