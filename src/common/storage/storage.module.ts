import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoredMedia } from '../../entities/stored-media.entity';
import { StorageService } from './storage.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([StoredMedia])],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}

