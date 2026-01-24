import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { User } from '../entities/user.entity';
import { UserCredentials } from '../entities/user-credentials.entity';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto/auth.dto';
import { AppLoggerService } from '../common/logger/logger.service';
import { RedisService } from '../common/redis/redis.service';
export declare class AuthService {
    private userModel;
    private credentialsModel;
    private jwtService;
    private configService;
    private readonly logger;
    private readonly redisService;
    constructor(userModel: Model<User>, credentialsModel: Model<UserCredentials>, jwtService: JwtService, configService: ConfigService, logger: AppLoggerService, redisService: RedisService);
    register(dto: RegisterDto): Promise<{
        user: any;
        accessToken: string;
        refreshToken: string;
    }>;
    login(dto: LoginDto): Promise<{
        user: any;
        accessToken: string;
        refreshToken: string;
    }>;
    refreshToken(dto: RefreshTokenDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    private generateTokens;
    private sanitizeUser;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{
        message: string;
    }>;
    logout(userId: string): Promise<{
        message: string;
    }>;
}
