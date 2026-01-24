import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User, UserSchema } from '../entities/user.entity';
import { ActivityLog, ActivityLogSchema } from '../entities/activity-log.entity';
import { Post, PostSchema } from '../entities/post.entity';
import { AdminGuard } from '../common/guards/admin.guard';
import { ModeratorGuard } from '../common/guards/moderator.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: ActivityLog.name, schema: ActivityLogSchema },
      { name: Post.name, schema: PostSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard, ModeratorGuard],
  exports: [AdminService],
})
export class AdminModule {}

