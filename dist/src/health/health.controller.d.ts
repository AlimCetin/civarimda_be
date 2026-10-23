import { HealthService } from './health.service';
export declare class HealthController {
    private readonly healthService;
    constructor(healthService: HealthService);
    check(): {
        status: string;
        timestamp: string;
        uptime: number;
        environment: string;
    };
    detailedCheck(): Promise<{
        status: string;
        timestamp: string;
        uptime: number;
        uptimeReadable: string;
        environment: string;
        services: {
            database: {
                status: string;
                state: string;
                message: string;
                type?: undefined;
                database?: undefined;
            } | {
                status: string;
                state: string;
                type: string;
                database: any;
                message?: undefined;
            } | {
                status: string;
                message: any;
                state?: undefined;
                type?: undefined;
                database?: undefined;
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
    metrics(): Promise<{
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
            type?: undefined;
            tables?: undefined;
            databaseSize?: undefined;
            message?: undefined;
        } | {
            type: string;
            tables: number;
            databaseSize: any;
            error?: undefined;
            message?: undefined;
        } | {
            error: string;
            message: any;
            type?: undefined;
            tables?: undefined;
            databaseSize?: undefined;
        };
    }>;
}
