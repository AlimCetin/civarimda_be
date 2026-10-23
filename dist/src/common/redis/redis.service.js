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
var RedisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const redis_1 = require("redis");
let RedisService = RedisService_1 = class RedisService {
    configService;
    client = null;
    logger = new common_1.Logger(RedisService_1.name);
    isConnected = false;
    redisUrl;
    inMemoryStore = new Map();
    constructor(configService) {
        this.configService = configService;
        this.redisUrl = this.configService.get('REDIS_URL');
    }
    async onModuleInit() {
        const isProduction = this.configService.get('NODE_ENV') === 'production';
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
    async connect(url) {
        const targetUrl = url || this.redisUrl;
        if (!targetUrl)
            return;
        if (this.isConnected && this.client) {
            return;
        }
        try {
            this.client = (0, redis_1.createClient)({
                url: targetUrl,
                socket: {
                    connectTimeout: 5000,
                    reconnectStrategy: (retries) => {
                        if (retries > 2) {
                            this.logger.warn('⚠️ Redis bağlantısı kurulamadı. Yeniden deneme durduruldu, In-Memory mod aktif.');
                            return false;
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
        }
        catch (error) {
            this.logger.warn(`⚠️ Redis bağlantısı kurulamadı (${error.message}). In-Memory fallback modu aktif.`);
            this.isConnected = false;
        }
    }
    async disconnect() {
        if (this.client && this.isConnected) {
            try {
                await this.client.quit();
                this.isConnected = false;
                this.logger.log('Redis bağlantısı kapatıldı.');
            }
            catch (error) {
                this.logger.error('Redis bağlantısı kapatılırken hata:', error);
            }
        }
    }
    async get(key) {
        try {
            if (this.isConnected && this.client) {
                return await this.client.get(key);
            }
        }
        catch (error) {
            this.logger.error(`Redis GET hatası (key: ${key}), in-memory kontrol ediliyor:`, error);
        }
        const item = this.inMemoryStore.get(key);
        if (!item)
            return null;
        if (item.expiresAt && Date.now() > item.expiresAt) {
            this.inMemoryStore.delete(key);
            return null;
        }
        return item.value;
    }
    async set(key, value, ttl) {
        try {
            if (this.isConnected && this.client) {
                if (ttl) {
                    await this.client.setEx(key, ttl, value);
                }
                else {
                    await this.client.set(key, value);
                }
                return;
            }
        }
        catch (error) {
            this.logger.error(`Redis SET hatası (key: ${key}):`, error);
        }
        this.inMemoryStore.set(key, {
            value,
            expiresAt: ttl ? Date.now() + ttl * 1000 : undefined,
        });
    }
    async del(key) {
        try {
            if (this.isConnected && this.client) {
                await this.client.del(key);
            }
        }
        catch (error) {
            this.logger.error(`Redis DEL hatası (key: ${key}):`, error);
        }
        this.inMemoryStore.delete(key);
    }
    async incr(key) {
        try {
            if (this.isConnected && this.client) {
                return await this.client.incr(key);
            }
        }
        catch (error) {
            this.logger.error(`Redis INCR hatası (key: ${key}):`, error);
        }
        const current = await this.get(key);
        const num = (parseInt(current || '0', 10) || 0) + 1;
        await this.set(key, num.toString());
        return num;
    }
    async decr(key) {
        try {
            if (this.isConnected && this.client) {
                return await this.client.decr(key);
            }
        }
        catch (error) {
            this.logger.error(`Redis DECR hatası (key: ${key}):`, error);
        }
        const current = await this.get(key);
        const num = (parseInt(current || '0', 10) || 0) - 1;
        await this.set(key, num.toString());
        return num;
    }
    async expire(key, seconds) {
        try {
            if (this.isConnected && this.client) {
                await this.client.expire(key, seconds);
                return;
            }
        }
        catch (error) {
            this.logger.error(`Redis EXPIRE hatası (key: ${key}):`, error);
        }
        const item = this.inMemoryStore.get(key);
        if (item) {
            item.expiresAt = Date.now() + seconds * 1000;
        }
    }
    async keys(pattern) {
        try {
            if (this.isConnected && this.client) {
                return await this.client.keys(pattern);
            }
        }
        catch (error) {
            this.logger.error(`Redis KEYS hatası (pattern: ${pattern}):`, error);
        }
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
    async mget(keys) {
        if (keys.length === 0)
            return [];
        try {
            if (this.isConnected && this.client) {
                return await this.client.mGet(keys);
            }
        }
        catch (error) {
            this.logger.error('Redis MGET hatası:', error);
        }
        return Promise.all(keys.map((k) => this.get(k)));
    }
    async mdel(keys) {
        if (keys.length === 0)
            return;
        try {
            if (this.isConnected && this.client) {
                await this.client.del(keys);
            }
        }
        catch (error) {
            this.logger.error('Redis MDEL hatası:', error);
        }
        for (const key of keys) {
            this.inMemoryStore.delete(key);
        }
    }
    getClient() {
        return this.client;
    }
    isClientConnected() {
        return this.isConnected;
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(config_1.ConfigService)),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis.service.js.map