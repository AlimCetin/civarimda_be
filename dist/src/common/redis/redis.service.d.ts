import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisClientType } from 'redis';
export declare class RedisService implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private client;
    private readonly logger;
    private isConnected;
    private redisUrl;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    connect(url?: string): Promise<void>;
    disconnect(): Promise<void>;
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttl?: number): Promise<void>;
    del(key: string): Promise<void>;
    incr(key: string): Promise<number>;
    decr(key: string): Promise<number>;
    expire(key: string, seconds: number): Promise<void>;
    keys(pattern: string): Promise<string[]>;
    mget(keys: string[]): Promise<(string | null)[]>;
    mdel(keys: string[]): Promise<void>;
    getClient(): RedisClientType;
    isClientConnected(): boolean;
}
