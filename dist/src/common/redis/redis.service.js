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
    client;
    logger = new common_1.Logger(RedisService_1.name);
    isConnected = false;
    redisUrl;
    constructor(configService) {
        this.configService = configService;
        this.redisUrl = this.configService.get('REDIS_URL') || 'redis://localhost:6379';
    }
    async onModuleInit() {
        await this.connect(this.redisUrl);
    }
    async onModuleDestroy() {
        await this.disconnect();
    }
    async connect(url) {
        if (this.isConnected && this.client) {
            return;
        }
        try {
            const redisUrl = url || this.redisUrl || 'redis://localhost:6379';
            this.client = (0, redis_1.createClient)({ url: redisUrl });
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
        }
        catch (error) {
            this.logger.error('Failed to connect to Redis', error);
            this.isConnected = false;
            throw error;
        }
    }
    async disconnect() {
        if (this.client && this.isConnected) {
            try {
                await this.client.quit();
                this.isConnected = false;
                this.logger.log('Redis disconnected');
            }
            catch (error) {
                this.logger.error('Error disconnecting Redis', error);
            }
        }
    }
    async get(key) {
        try {
            if (!this.isConnected) {
                await this.connect();
            }
            return await this.client.get(key);
        }
        catch (error) {
            this.logger.error(`Redis GET error for key: ${key}`, error);
            return null;
        }
    }
    async set(key, value, ttl) {
        try {
            if (!this.isConnected) {
                await this.connect();
            }
            if (ttl) {
                await this.client.setEx(key, ttl, value);
            }
            else {
                await this.client.set(key, value);
            }
        }
        catch (error) {
            this.logger.error(`Redis SET error for key: ${key}`, error);
        }
    }
    async del(key) {
        try {
            if (!this.isConnected) {
                await this.connect();
            }
            await this.client.del(key);
        }
        catch (error) {
            this.logger.error(`Redis DEL error for key: ${key}`, error);
        }
    }
    async incr(key) {
        try {
            if (!this.isConnected) {
                await this.connect();
            }
            return await this.client.incr(key);
        }
        catch (error) {
            this.logger.error(`Redis INCR error for key: ${key}`, error);
            return 0;
        }
    }
    async decr(key) {
        try {
            if (!this.isConnected) {
                await this.connect();
            }
            return await this.client.decr(key);
        }
        catch (error) {
            this.logger.error(`Redis DECR error for key: ${key}`, error);
            return 0;
        }
    }
    async expire(key, seconds) {
        try {
            if (!this.isConnected) {
                await this.connect();
            }
            await this.client.expire(key, seconds);
        }
        catch (error) {
            this.logger.error(`Redis EXPIRE error for key: ${key}`, error);
        }
    }
    async keys(pattern) {
        try {
            if (!this.isConnected) {
                await this.connect();
            }
            return await this.client.keys(pattern);
        }
        catch (error) {
            this.logger.error(`Redis KEYS error for pattern: ${pattern}`, error);
            return [];
        }
    }
    async mget(keys) {
        try {
            if (!this.isConnected) {
                await this.connect();
            }
            if (keys.length === 0)
                return [];
            return await this.client.mGet(keys);
        }
        catch (error) {
            this.logger.error('Redis MGET error', error);
            return [];
        }
    }
    async mdel(keys) {
        try {
            if (!this.isConnected) {
                await this.connect();
            }
            if (keys.length === 0)
                return;
            await this.client.del(keys);
        }
        catch (error) {
            this.logger.error('Redis MDEL error', error);
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