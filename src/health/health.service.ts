import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { RedisService } from '../common/redis/redis.service';

@Injectable()
export class HealthService {
  private startTime: number = Date.now();

  constructor(
    @InjectConnection() private connection: Connection,
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
   * Check MongoDB connection
   */
  private async checkDatabase() {
    try {
      const state = this.connection.readyState;
      const states: Record<number, string> = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
      };

      if (state === 1 && this.connection.db) {
        // Test the connection
        await this.connection.db.admin().ping();

        return {
          status: 'up',
          state: states[state],
          host: this.connection.host,
          name: this.connection.name,
        };
      } else {
        return {
          status: 'down',
          state: states[state] || 'unknown',
          message: 'Database not connected',
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

      // Try to ping Redis
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
   * Get database metrics (connection pool, etc.)
   */
  private async getDatabaseMetrics() {
    try {
      const db = this.connection.db;
      
      if (!db) {
        return {
          error: 'Database not connected',
        };
      }
      
      // Get database stats
      const stats = await db.stats();
      
      return {
        collections: stats.collections,
        dataSize: this.formatBytes(stats.dataSize),
        indexSize: this.formatBytes(stats.indexSize),
        storageSize: this.formatBytes(stats.storageSize),
        indexes: stats.indexes,
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

  /**
   * Format bytes to human readable format
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Format uptime to human readable format
   */
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

