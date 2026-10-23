import { Injectable, OnModuleDestroy, OnModuleInit, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

interface MemoryItem {
  value: string;
  expiresAt?: number;
}

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType | null = null;
  private readonly logger = new Logger(RedisService.name);
  private isConnected = false;
  private redisUrl: string | undefined;
  private inMemoryStore = new Map<string, MemoryItem>();

  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {
    this.redisUrl = this.configService.get<string>('REDIS_URL');
  }

  async onModuleInit() {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

    if (!this.redisUrl) {
      if (isProduction) {
        this.logger.warn('⚠️ REDIS_URL ayarlanmamış. In-Memory önbellekleme (RAM fallback) modu kullanılacak.');
        return;
      }
      this.redisUrl = 'redis://localhost:6379';
    }

    await this.connect(this.redisUrl);
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  async connect(url?: string): Promise<void> {
    const targetUrl = url || this.redisUrl;
    if (!targetUrl) return;

    if (this.isConnected && this.client) {
      return;
    }

    try {
      this.client = createClient({
        url: targetUrl,
        socket: {
          connectTimeout: 5000,
          reconnectStrategy: (retries) => {
            if (retries > 2) {
              this.logger.warn('⚠️ Redis bağlantısı kurulamadı. Yeniden deneme durduruldu, In-Memory mod aktif.');
              return false; // Stop reconnecting and spamming logs
            }
            return Math.min(retries * 1000, 3000);
          },
        },
      });

      this.client.on('error', (err) => {
        if (this.isConnected) {
          this.logger.warn(`Redis Client Hatası: ${err.message}`);
        }
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        this.logger.log('Redis bağlanıyor...');
      });

      this.client.on('ready', () => {
        this.logger.log('✅ Redis bağlantısı başarıyla kuruldu.');
        this.isConnected = true;
      });

      this.client.on('end', () => {
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error: any) {
      this.logger.warn(`⚠️ Redis bağlantısı kurulamadı (${error.message}). In-Memory fallback modu aktif.`);
      this.isConnected = false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      try {
        await this.client.quit();
        this.isConnected = false;
        this.logger.log('Redis bağlantısı kapatıldı.');
      } catch (error) {
        this.logger.error('Redis bağlantısı kapatılırken hata:', error);
      }
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      if (this.isConnected && this.client) {
        return await this.client.get(key);
      }
    } catch (error) {
      this.logger.error(`Redis GET hatası (key: ${key}), in-memory kontrol ediliyor:`, error);
    }

    // In-memory fallback
    const item = this.inMemoryStore.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.inMemoryStore.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      if (this.isConnected && this.client) {
        if (ttl) {
          await this.client.setEx(key, ttl, value);
        } else {
          await this.client.set(key, value);
        }
        return;
      }
    } catch (error) {
      this.logger.error(`Redis SET hatası (key: ${key}):`, error);
    }

    // In-memory fallback
    this.inMemoryStore.set(key, {
      value,
      expiresAt: ttl ? Date.now() + ttl * 1000 : undefined,
    });
  }

  async del(key: string): Promise<void> {
    try {
      if (this.isConnected && this.client) {
        await this.client.del(key);
      }
    } catch (error) {
      this.logger.error(`Redis DEL hatası (key: ${key}):`, error);
    }
    this.inMemoryStore.delete(key);
  }

  async incr(key: string): Promise<number> {
    try {
      if (this.isConnected && this.client) {
        return await this.client.incr(key);
      }
    } catch (error) {
      this.logger.error(`Redis INCR hatası (key: ${key}):`, error);
    }

    // In-memory fallback
    const current = await this.get(key);
    const num = (parseInt(current || '0', 10) || 0) + 1;
    await this.set(key, num.toString());
    return num;
  }

  async decr(key: string): Promise<number> {
    try {
      if (this.isConnected && this.client) {
        return await this.client.decr(key);
      }
    } catch (error) {
      this.logger.error(`Redis DECR hatası (key: ${key}):`, error);
    }

    // In-memory fallback
    const current = await this.get(key);
    const num = (parseInt(current || '0', 10) || 0) - 1;
    await this.set(key, num.toString());
    return num;
  }

  async expire(key: string, seconds: number): Promise<void> {
    try {
      if (this.isConnected && this.client) {
        await this.client.expire(key, seconds);
        return;
      }
    } catch (error) {
      this.logger.error(`Redis EXPIRE hatası (key: ${key}):`, error);
    }

    const item = this.inMemoryStore.get(key);
    if (item) {
      item.expiresAt = Date.now() + seconds * 1000;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      if (this.isConnected && this.client) {
        return await this.client.keys(pattern);
      }
    } catch (error) {
      this.logger.error(`Redis KEYS hatası (pattern: ${pattern}):`, error);
    }

    // In-memory simple pattern matching (prefix/wildcard)
    const allKeys = Array.from(this.inMemoryStore.keys()).filter((key) => {
      const item = this.inMemoryStore.get(key);
      if (item?.expiresAt && Date.now() > item.expiresAt) {
        this.inMemoryStore.delete(key);
        return false;
      }
      return true;
    });

    if (pattern === '*' || !pattern) {
      return allKeys;
    }

    const regexPattern = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return allKeys.filter((k) => regexPattern.test(k));
  }

  async mget(keys: string[]): Promise<(string | null)[]> {
    if (keys.length === 0) return [];

    try {
      if (this.isConnected && this.client) {
        return await this.client.mGet(keys);
      }
    } catch (error) {
      this.logger.error('Redis MGET hatası:', error);
    }

    return Promise.all(keys.map((k) => this.get(k)));
  }

  async mdel(keys: string[]): Promise<void> {
    if (keys.length === 0) return;

    try {
      if (this.isConnected && this.client) {
        await this.client.del(keys);
      }
    } catch (error) {
      this.logger.error('Redis MDEL hatası:', error);
    }

    for (const key of keys) {
      this.inMemoryStore.delete(key);
    }
  }

  getClient(): RedisClientType | null {
    return this.client;
  }

  isClientConnected(): boolean {
    return this.isConnected;
  }
}
