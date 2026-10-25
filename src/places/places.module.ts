import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Place } from '../entities/place.entity';
import { ItemComment } from '../entities/item-comment.entity';
import { User } from '../entities/user.entity';
import { PlacesService } from './places.service';
import { PlacesController } from './places.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Place, ItemComment, User]),
  ],
  controllers: [PlacesController],
  providers: [PlacesService],
  exports: [PlacesService],
})
export class PlacesModule {}
