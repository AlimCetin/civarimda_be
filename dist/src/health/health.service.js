"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const redis_service_1 = require("../common/redis/redis.service");
let HealthService = class HealthService {
    dataSource;
    redisService;
    startTime = Date.now();
    constructor(dataSource, redisService) {
        this.dataSource = dataSource;
        this.redisService = redisService;
    }
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
    async checkDatabase() {
        try {
            if (!this.dataSource || !this.dataSource.isInitialized) {
                return {
                    status: 'down',
                    state: 'disconnected',
                    message: 'PostgreSQL database not initialized',
                };
            }
            await this.dataSource.query('SELECT 1');
            return {
                status: 'up',
                state: 'connected',
                type: 'postgres',
                database: this.dataSource.options.database || 'civarimda',
            };
        }
        catch (error) {
            return {
                status: 'down',
                message: error.message,
            };
        }
    }
    async checkRedis() {
        try {
            if (!this.redisService.isClientConnected()) {
                return {
                    status: 'up',
                    state: 'in-memory-fallback',
                    message: 'Redis is not connected; operating in in-memory mode',
                };
            }
            const client = this.redisService.getClient();
            if (!client) {
                return {
                    status: 'up',
                    state: 'in-memory-fallback',
                    message: 'Redis client not initialized; operating in in-memory mode',
                };
            }
            try {
                const result = await client.ping();
                return {
                    status: 'up',
                    state: 'ready',
                    response: result,
                };
            }
            catch (pingError) {
                return {
                    status: 'up',
                    state: 'in-memory-fallback',
                    message: pingError.message || 'Redis ping failed; operating in in-memory mode',
                };
            }
        }
        catch (error) {
            return {
                status: 'up',
                state: 'in-memory-fallback',
                message: error.message,
            };
        }
    }
    async getDatabaseMetrics() {
        try {
            if (!this.dataSource || !this.dataSource.isInitialized) {
                return {
                    error: 'Database not connected',
                };
            }
            const [tableCountResult] = await this.dataSource.query(`SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'`);
            const [dbSizeResult] = await this.dataSource.query(`SELECT pg_size_pretty(pg_database_size(current_database())) as size`);
            return {
                type: 'PostgreSQL',
                tables: Number(tableCountResult?.count || 0),
                databaseSize: dbSizeResult?.size || 'unknown',
            };
        }
        catch (error) {
            return {
                error: 'Could not fetch database metrics',
                message: error.message,
            };
        }
    }
    getSystemInfo() {
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
    formatBytes(bytes) {
        if (bytes === 0)
            return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    formatUptime(seconds) {
        const days = Math.floor(seconds / (3600 * 24));
        const hours = Math.floor((seconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const parts = [];
        if (days > 0)
            parts.push(`${days}d`);
        if (hours > 0)
            parts.push(`${hours}h`);
        if (minutes > 0)
            parts.push(`${minutes}m`);
        if (secs > 0 || parts.length === 0)
            parts.push(`${secs}s`);
        return parts.join(' ');
    }
};
exports.HealthService = HealthService;
exports.HealthService = HealthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.DataSource,
        redis_service_1.RedisService])
], HealthService);
//# sourceMappingURL=health.service.js.map