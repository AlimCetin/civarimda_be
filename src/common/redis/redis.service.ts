import { Injectable, OnModuleDestroy, OnModuleInit, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;
  private readonly logger = new Logger(RedisService.name);
  private isConnected = false;
  private redisUrl: string;

  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {
    this.redisUrl = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
  }

  async onModuleInit() {
    await this.connect(this.redisUrl);
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  async connect(url?: string): Promise<void> {
    if (this.isConnected && this.client) {
      return;
    }

    try {
      const redisUrl = url || this.redisUrl || 'redis://localhost:6379';
      this.client = createClient({ url: redisUrl });
      
      this.client.on('error', (err) => {
        this.logger.error('Redis Client Error', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        this.logger.log('Redis connecting...');
      });

      this.client.on('ready', () => {
        this.logger.log('Redis connected successfully');
        this.isConnected = true;
      });

      this.client.on('end', () => {
        this.logger.log('Redis connection closed');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      this.logger.error('Failed to connect to Redis', error);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      try {
        await this.client.quit();
        this.isConnected = false;
        this.logger.log('Redis disconnected');
      } catch (error) {
        this.logger.error('Error disconnecting Redis', error);
      }
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      return await this.client.get(key);
    } catch (error) {
      this.logger.error(`Redis GET error for key: ${key}`, error);
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      if (ttl) {
        await this.client.setEx(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      this.logger.error(`Redis SET error for key: ${key}`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      await this.client.del(key);
    } catch (error) {
      this.logger.error(`Redis DEL error for key: ${key}`, error);
    }
  }

  async incr(key: string): Promise<number> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      return await this.client.incr(key);
    } catch (error) {
      this.logger.error(`Redis INCR error for key: ${key}`, error);
      return 0;
    }
  }

  async decr(key: string): Promise<number> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      return await this.client.decr(key);
    } catch (error) {
      this.logger.error(`Redis DECR error for key: ${key}`, error);
      return 0;
    }
  }

  async expire(key: string, seconds: number): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      await this.client.expire(key, seconds);
    } catch (error) {
      this.logger.error(`Redis EXPIRE error for key: ${key}`, error);
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      return await this.client.keys(pattern);
    } catch (error) {
      this.logger.error(`Redis KEYS error for pattern: ${pattern}`, error);
      return [];
    }
  }

  async mget(keys: string[]): Promise<(string | null)[]> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      if (keys.length === 0) return [];
      return await this.client.mGet(keys);
    } catch (error) {
      this.logger.error('Redis MGET error', error);
      return [];
    }
  }

  async mdel(keys: string[]): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      if (keys.length === 0) return;
      await this.client.del(keys);
    } catch (error) {
      this.logger.error('Redis MDEL error', error);
    }
  }

  getClient(): RedisClientType {
    return this.client;
  }

  isClientConnected(): boolean {
    return this.isConnected;
  }
}

