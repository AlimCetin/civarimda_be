import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegionalNews } from '../entities/regional-news.entity';
import { User } from '../entities/user.entity';
import { ModeratorGuard } from '../common/guards/moderator.guard';
import { NewsController } from './news.controller';
import { NewsService } from './news.service';

@Module({
  imports: [TypeOrmModule.forFeature([RegionalNews, User])],
  controllers: [NewsController],
  providers: [NewsService, ModeratorGuard],
  exports: [NewsService],
})
export class NewsModule {}

