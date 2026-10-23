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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const user_entity_1 = require("../entities/user.entity");
const user_credentials_entity_1 = require("../entities/user-credentials.entity");
const logger_service_1 = require("../common/logger/logger.service");
const redis_service_1 = require("../common/redis/redis.service");
let AuthService = class AuthService {
    userRepository;
    credentialsRepository;
    jwtService;
    configService;
    logger;
    redisService;
    constructor(userRepository, credentialsRepository, jwtService, configService, logger, redisService) {
        this.userRepository = userRepository;
        this.credentialsRepository = credentialsRepository;
        this.jwtService = jwtService;
        this.configService = configService;
        this.logger = logger;
        this.redisService = redisService;
    }
    async register(dto) {
        const emailLower = dto.email.toLowerCase().trim();
        const exists = await this.credentialsRepository.findOne({ where: { email: emailLower } });
        if (exists)
            throw new common_1.ConflictException('User already exists');
        const user = this.userRepository.create({
            fullName: dto.fullName,
        });
        await this.userRepository.save(user);
        const credentials = this.credentialsRepository.create({
            userId: user.id,
            email: emailLower,
            password: dto.password,
        });
        await this.credentialsRepository.save(credentials);
        const tokens = await this.generateTokens(user.id);
        await this.redisService.set(`refresh_token:${user.id}`, tokens.refreshToken, 604800);
        await this.credentialsRepository.update({ userId: user.id }, { refreshToken: tokens.refreshToken });
        return { ...tokens, user: this.sanitizeUser(user) };
    }
    async login(dto) {
        const emailLower = dto.email.toLowerCase().trim();
        const credentials = await this.credentialsRepository
            .createQueryBuilder('c')
            .addSelect('c.password')
            .addSelect('c.refreshToken')
            .where('c.email = :email', { email: emailLower })
            .getOne();
        if (!credentials || !(await credentials.comparePassword(dto.password))) {
            this.logger.securityEvent('Failed login attempt', {
                email: emailLower,
                reason: credentials ? 'Invalid password' : 'User not found',
                timestamp: new Date().toISOString(),
            });
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const user = await this.userRepository.findOne({ where: { id: credentials.userId } });
        if (!user) {
            this.logger.securityEvent('Failed login attempt', {
                email: emailLower,
                reason: 'User not found after credentials match',
                timestamp: new Date().toISOString(),
            });
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        this.logger.log(`User logged in successfully: ${emailLower}`, 'AuthService');
        const tokens = await this.generateTokens(user.id);
        await this.redisService.set(`refresh_token:${user.id}`, tokens.refreshToken, 604800);
        await this.credentialsRepository.update({ email: emailLower }, { refreshToken: tokens.refreshToken });
        return { ...tokens, user: this.sanitizeUser(user) };
    }
    async refreshToken(dto) {
        try {
            const refreshSecret = this.configService.get('JWT_REFRESH_SECRET') ||
                this.configService.get('JWT_SECRET');
            if (!refreshSecret) {
                throw new common_1.UnauthorizedException('JWT secret not configured');
            }
            let payload;
            try {
                payload = this.jwtService.verify(dto.refreshToken, {
                    secret: refreshSecret,
                });
            }
            catch (error) {
                this.logger.securityEvent('Invalid refresh token attempt', {
                    reason: 'Token verification failed',
                    timestamp: new Date().toISOString(),
                });
                throw new common_1.UnauthorizedException('Invalid or expired refresh token');
            }
            const storedToken = await this.redisService.get(`refresh_token:${payload.id}`);
            if (!storedToken) {
                this.logger.securityEvent('Invalid refresh token attempt', {
                    userId: payload.id,
                    reason: 'Refresh token not found in Redis',
                    timestamp: new Date().toISOString(),
                });
                throw new common_1.UnauthorizedException('Refresh token not found');
            }
            if (storedToken !== dto.refreshToken) {
                this.logger.securityEvent('Invalid refresh token attempt', {
                    userId: payload.id,
                    reason: 'Refresh token mismatch',
                    timestamp: new Date().toISOString(),
                });
                throw new common_1.UnauthorizedException('Refresh token mismatch');
            }
            const tokens = await this.generateTokens(payload.id);
            await this.redisService.set(`refresh_token:${payload.id}`, tokens.refreshToken, 604800);
            await this.credentialsRepository.update({ userId: payload.id }, { refreshToken: tokens.refreshToken });
            return tokens;
        }
        catch (error) {
            if (error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
    async generateTokens(userId) {
        const payload = { id: userId };
        const jwtSecret = this.configService.get('JWT_SECRET');
        if (!jwtSecret) {
            throw new Error('JWT_SECRET environment variable is required');
        }
        const refreshSecret = this.configService.get('JWT_REFRESH_SECRET') || jwtSecret;
        const accessToken = this.jwtService.sign(payload, {
            secret: jwtSecret,
            expiresIn: '1h',
        });
        const refreshToken = this.jwtService.sign(payload, {
            secret: refreshSecret,
            expiresIn: '7d',
        });
        return { accessToken, refreshToken };
    }
    sanitizeUser(user) {
        const obj = user.toObject ? user.toObject() : { ...user };
        delete obj.password;
        return obj;
    }
    async changePassword(userId, currentPassword, newPassword) {
        const credentials = await this.credentialsRepository
            .createQueryBuilder('c')
            .addSelect('c.password')
            .where('c.userId = :userId', { userId })
            .getOne();
        if (!credentials) {
            throw new common_1.UnauthorizedException('User credentials not found');
        }
        if (!(await credentials.comparePassword(currentPassword))) {
            this.logger.securityEvent('Failed password change attempt', {
                userId: userId.toString(),
                reason: 'Invalid current password',
                timestamp: new Date().toISOString(),
            });
            throw new common_1.UnauthorizedException('Current password is incorrect');
        }
        if (await credentials.comparePassword(newPassword)) {
            throw new common_1.BadRequestException('New password must be different from current password');
        }
        credentials.password = newPassword;
        await this.credentialsRepository.save(credentials);
        this.logger.securityEvent('Password changed successfully', {
            userId: userId.toString(),
            timestamp: new Date().toISOString(),
        });
        return { message: 'Password changed successfully' };
    }
    async logout(userId) {
        await this.redisService.del(`refresh_token:${userId}`);
        await this.credentialsRepository.update({ userId }, { refreshToken: null });
        this.logger.log(`User logged out: ${userId}`, 'AuthService');
        return { message: 'Logged out successfully' };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(user_credentials_entity_1.UserCredentials)),
    __param(4, (0, common_1.Inject)(logger_service_1.AppLoggerService)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService,
        config_1.ConfigService,
        logger_service_1.AppLoggerService,
        redis_service_1.RedisService])
], AuthService);
//# sourceMappingURL=auth.service.js.map