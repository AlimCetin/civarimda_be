import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OtaRelease } from '../entities/ota-release.entity';
import { User } from '../entities/user.entity';
import { AdminGuard } from '../common/guards/admin.guard';
import { OtaUpdatesController } from './ota-updates.controller';
import { OtaUpdatesService } from './ota-updates.service';

@Module({
  imports: [TypeOrmModule.forFeature([OtaRelease, User])],
  controllers: [OtaUpdatesController],
  providers: [OtaUpdatesService, AdminGuard],
  exports: [OtaUpdatesService],
})
export class OtaUpdatesModule {}

