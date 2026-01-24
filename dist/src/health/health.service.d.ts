import { Connection } from 'mongoose';
import { RedisService } from '../common/redis/redis.service';
export declare class HealthService {
    private connection;
    private redisService;
    private startTime;
    constructor(connection: Connection, redisService: RedisService);
    getDetailedHealth(): Promise<{
        status: string;
        timestamp: string;
        uptime: number;
        uptimeReadable: string;
        environment: string;
        services: {
            database: {
                status: string;
                state: string;
                host: string;
                name: string;
                message?: undefined;
            } | {
                status: string;
                state: string;
                message: string;
                host?: undefined;
                name?: undefined;
            } | {
                status: string;
                message: any;
                state?: undefined;
                host?: undefined;
                name?: undefined;
            };
            redis: {
                status: string;
                state: string;
                response: any;
                message?: undefined;
            } | {
                status: string;
                state: string;
                message: any;
                response?: undefined;
            } | {
                status: string;
                message: any;
                state?: undefined;
                response?: undefined;
            };
        };
        system: {
            nodeVersion: string;
            platform: NodeJS.Platform;
            arch: NodeJS.Architecture;
            pid: number;
            memory: {
                total: string;
                heapUsed: string;
                heapTotal: string;
            };
        };
    }>;
    getMetrics(): Promise<{
        timestamp: string;
        uptime: number;
        uptimeReadable: string;
        memory: {
            rss: string;
            heapTotal: string;
            heapUsed: string;
            external: string;
            arrayBuffers: string;
        };
        cpu: {
            user: number;
            system: number;
        };
        process: {
            pid: number;
            version: string;
            platform: NodeJS.Platform;
            arch: NodeJS.Architecture;
        };
        database: {
            error: string;
            collections?: undefined;
            dataSize?: undefined;
            indexSize?: undefined;
            storageSize?: undefined;
            indexes?: undefined;
            message?: undefined;
        } | {
            collections: any;
            dataSize: string;
            indexSize: string;
            storageSize: string;
            indexes: any;
            error?: undefined;
            message?: undefined;
        } | {
            error: string;
            message: any;
            collections?: undefined;
            dataSize?: undefined;
            indexSize?: undefined;
            storageSize?: undefined;
            indexes?: undefined;
        };
    }>;
    private checkDatabase;
    private checkRedis;
    private getDatabaseMetrics;
    private getSystemInfo;
    private formatBytes;
    private formatUptime;
}
