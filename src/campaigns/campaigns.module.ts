import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Campaign } from '../entities/campaign.entity';
import { ClaimedCode } from '../entities/claimed-code.entity';
import { ItemComment } from '../entities/item-comment.entity';
import { User } from '../entities/user.entity';
import { CampaignsService } from './campaigns.service';
import { CampaignsController } from './campaigns.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Campaign, ClaimedCode, ItemComment, User]),
  ],
  controllers: [CampaignsController],
  providers: [CampaignsService],
  exports: [CampaignsService],
})
export class CampaignsModule {}
