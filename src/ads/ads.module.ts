import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdsController } from './ads.controller';
import { AdsService } from './ads.service';
import { Ad, AdSchema } from '../entities/ad.entity';
import { ActivityLog, ActivityLogSchema } from '../entities/activity-log.entity';
import { User, UserSchema } from '../entities/user.entity';
import { AdminGuard } from '../common/guards/admin.guard';
import { ModeratorGuard } from '../common/guards/moderator.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Ad.name, schema: AdSchema },
      { name: ActivityLog.name, schema: ActivityLogSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [AdsController],
  providers: [AdsService, AdminGuard, ModeratorGuard],
  exports: [AdsService],
})
export class AdsModule {}

