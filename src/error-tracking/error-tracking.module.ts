import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemErrorLog } from '../entities/system-error-log.entity';
import { User } from '../entities/user.entity';
import { AdminGuard } from '../common/guards/admin.guard';
import { ErrorTrackingController } from './error-tracking.controller';
import { ErrorTrackingService } from './error-tracking.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([SystemErrorLog, User])],
  controllers: [ErrorTrackingController],
  providers: [ErrorTrackingService, AdminGuard],
  exports: [ErrorTrackingService],
})
export class ErrorTrackingModule {}

