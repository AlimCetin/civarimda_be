import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../entities/user.entity';
import { ActivityLog } from '../entities/activity-log.entity';
import { Post } from '../entities/post.entity';
import { AdminGuard } from '../common/guards/admin.guard';
import { ModeratorGuard } from '../common/guards/moderator.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      ActivityLog,
      Post,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard, ModeratorGuard],
  exports: [AdminService],
})
export class AdminModule {}
