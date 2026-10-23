import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Report } from '../entities/report.entity';
import { Post } from '../entities/post.entity';
import { User } from '../entities/user.entity';
import { Comment } from '../entities/comment.entity';
import { Message } from '../entities/message.entity';
import { ModeratorGuard } from '../common/guards/moderator.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Report,
      Post,
      User,
      Comment,
      Message,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService, ModeratorGuard],
  exports: [ReportsService],
})
export class ReportsModule {}
