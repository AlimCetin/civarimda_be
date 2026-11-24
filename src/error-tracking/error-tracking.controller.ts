import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { User } from '../entities/user.entity';
import type { ErrorSource } from '../entities/system-error-log.entity';
import { ErrorTrackingService } from './error-tracking.service';
import { ReportClientErrorDto } from './dto/report-error.dto';

@Controller()
export class ErrorTrackingController {
  constructor(private readonly errorTrackingService: ErrorTrackingService) {}

  @Post('errors/report')
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  async reportClientError(@Body() dto: ReportClientErrorDto) {
    await this.errorTrackingService.recordError({
      source: dto.source,
      severity: dto.severity || 'error',
      message: dto.message,
      stack: dto.stack,
      path: dto.path,
      deviceInfo: dto.deviceInfo,
    });
    return { success: true };
  }

  @Get('admin/error-logs')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getErrorLogs(
    @Query('source') source?: ErrorSource,
    @Query('isResolved') isResolved?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit: number = 30,
  ) {
    const resolvedBool =
      isResolved === 'true' ? true : isResolved === 'false' ? false : undefined;
    return this.errorTrackingService.findAll({
      source,
      isResolved: resolvedBool,
      page,
      limit,
    });
  }

  @Patch('admin/error-logs/:id/resolve')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async resolveErrorLog(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isResolved') isResolved: boolean,
    @CurrentUser() admin: User,
  ) {
    return this.errorTrackingService.setResolved(id, admin.id, isResolved !== false);
  }
}

