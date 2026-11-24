import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppVersion } from '../entities/app-version.entity';
import { User } from '../entities/user.entity';
import { AdminGuard } from '../common/guards/admin.guard';
import { AppVersionsController } from './app-versions.controller';
import { AppVersionsService } from './app-versions.service';

@Module({
  imports: [TypeOrmModule.forFeature([AppVersion, User])],
  controllers: [AppVersionsController],
  providers: [AppVersionsService, AdminGuard],
  exports: [AppVersionsService],
})
export class AppVersionsModule {}

