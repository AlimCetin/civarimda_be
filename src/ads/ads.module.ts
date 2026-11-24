import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdsController } from './ads.controller';
import { AdsService } from './ads.service';
import { Ad } from '../entities/ad.entity';
import { AdPackage } from '../entities/ad-package.entity';
import { AdPurchase } from '../entities/ad-purchase.entity';
import { ActivityLog } from '../entities/activity-log.entity';
import { User } from '../entities/user.entity';
import { AdminGuard } from '../common/guards/admin.guard';
import { ModeratorGuard } from '../common/guards/moderator.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Ad,
      AdPackage,
      AdPurchase,
      ActivityLog,
      User,
    ]),
  ],
  controllers: [AdsController],
  providers: [AdsService, AdminGuard, ModeratorGuard],
  exports: [AdsService],
})
export class AdsModule {}
