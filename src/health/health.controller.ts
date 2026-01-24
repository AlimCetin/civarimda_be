import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * Basic health check endpoint
   * Returns 200 OK if service is running
   */
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  /**
   * Detailed health check with database and Redis status
   * GET /health/detailed
   */
  @Get('detailed')
  async detailedCheck() {
    return this.healthService.getDetailedHealth();
  }

  /**
   * Performance metrics endpoint
   * GET /health/metrics
   */
  @Get('metrics')
  async metrics() {
    return this.healthService.getMetrics();
  }
}

