import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { RedisService } from '../common/redis/redis.service';

@Injectable()
export class HealthService {
  private startTime: number = Date.now();

  constructor(
    @InjectDataSource() private dataSource: DataSource,
    private redisService: RedisService,
  ) {}

  /**
   * Get detailed health status including database and Redis
   */
  async getDetailedHealth() {
    const [dbStatus, redisStatus] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const isHealthy = dbStatus.status === 'up' && redisStatus.status === 'up';

    return {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      uptimeReadable: this.formatUptime(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: dbStatus,
        redis: redisStatus,
      },
      system: this.getSystemInfo(),
    };
  }

  /**
   * Get performance metrics
   */
  async getMetrics() {
    const memoryUsage = process.memoryUsage();

    return {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      uptimeReadable: this.formatUptime(process.uptime()),
      memory: {
        rss: this.formatBytes(memoryUsage.rss),
        heapTotal: this.formatBytes(memoryUsage.heapTotal),
        heapUsed: this.formatBytes(memoryUsage.heapUsed),
        external: this.formatBytes(memoryUsage.external),
        arrayBuffers: this.formatBytes(memoryUsage.arrayBuffers),
      },
      cpu: {
        user: process.cpuUsage().user,
        system: process.cpuUsage().system,
      },
      process: {
        pid: process.pid,
        version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      database: await this.getDatabaseMetrics(),
    };
  }

  /**
   * Check PostgreSQL connection
   */
  private async checkDatabase() {
    try {
      if (!this.dataSource || !this.dataSource.isInitialized) {
        return {
          status: 'down',
          state: 'disconnected',
          message: 'PostgreSQL database not initialized',
        };
      }

      // Test connection
      await this.dataSource.query('SELECT 1');

      return {
        status: 'up',
        state: 'connected',
        type: 'postgres',
        database: (this.dataSource.options as any).database || 'civarimda',
      };
    } catch (error: any) {
      return {
        status: 'down',
        message: error.message,
      };
    }
  }

  /**
   * Check Redis connection
   */
  private async checkRedis() {
    try {
      const client = this.redisService['client'] as any;
      
      if (!client) {
        return {
          status: 'down',
          message: 'Redis client not initialized',
        };
      }

      try {
        const result = await client.ping();
        
        return {
          status: 'up',
          state: 'ready',
          response: result,
        };
      } catch (pingError: any) {
        return {
          status: 'down',
          state: 'disconnected',
          message: pingError.message || 'Redis ping failed',
        };
      }
    } catch (error: any) {
      return {
        status: 'down',
        message: error.message,
      };
    }
  }

  /**
   * Get database metrics (table count, size, etc.)
   */
  private async getDatabaseMetrics() {
    try {
      if (!this.dataSource || !this.dataSource.isInitialized) {
        return {
          error: 'Database not connected',
        };
      }

      const [tableCountResult] = await this.dataSource.query(
        `SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'`
      );
      const [dbSizeResult] = await this.dataSource.query(
        `SELECT pg_size_pretty(pg_database_size(current_database())) as size`
      );

      return {
        type: 'PostgreSQL',
        tables: Number(tableCountResult?.count || 0),
        databaseSize: dbSizeResult?.size || 'unknown',
      };
    } catch (error: any) {
      return {
        error: 'Could not fetch database metrics',
        message: error.message,
      };
    }
  }

  /**
   * Get system information
   */
  private getSystemInfo() {
    const memoryUsage = process.memoryUsage();

    return {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      memory: {
        total: this.formatBytes(memoryUsage.rss),
        heapUsed: this.formatBytes(memoryUsage.heapUsed),
        heapTotal: this.formatBytes(memoryUsage.heapTotal),
      },
    };
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

    return parts.join(' ');
  }
}
