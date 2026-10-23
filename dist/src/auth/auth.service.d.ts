import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../entities/user.entity';
import { UserCredentials } from '../entities/user-credentials.entity';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto/auth.dto';
import { AppLoggerService } from '../common/logger/logger.service';
import { RedisService } from '../common/redis/redis.service';
export declare class AuthService {
    private userRepository;
    private credentialsRepository;
    private jwtService;
    private configService;
    private readonly logger;
    private readonly redisService;
    constructor(userRepository: Repository<User>, credentialsRepository: Repository<UserCredentials>, jwtService: JwtService, configService: ConfigService, logger: AppLoggerService, redisService: RedisService);
    register(dto: RegisterDto): Promise<{
        user: (User & {
            _id: string;
            followers: string[];
            following: string[];
            blockedUsers: string[];
            savedPosts: string[];
            hiddenFollowers: string[];
            hiddenFollowing: string[];
        }) | {
            id: string;
            fullName: string;
            avatar: string | null;
            bio: string;
            followers: string[];
            following: string[];
            blockedUsers: string[];
            savedPosts: string[];
            isVerified: boolean;
            hideFollowers: boolean;
            hideFollowing: boolean;
            hiddenFollowers: string[];
            hiddenFollowing: string[];
            role: string;
            warningCount: number;
            bannedUntil: Date | null;
            isPermanentlyBanned: boolean;
            deletedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    login(dto: LoginDto): Promise<{
        user: (User & {
            _id: string;
            followers: string[];
            following: string[];
            blockedUsers: string[];
            savedPosts: string[];
            hiddenFollowers: string[];
            hiddenFollowing: string[];
        }) | {
            id: string;
            fullName: string;
            avatar: string | null;
            bio: string;
            followers: string[];
            following: string[];
            blockedUsers: string[];
            savedPosts: string[];
            isVerified: boolean;
            hideFollowers: boolean;
            hideFollowing: boolean;
            hiddenFollowers: string[];
            hiddenFollowing: string[];
            role: string;
            warningCount: number;
            bannedUntil: Date | null;
            isPermanentlyBanned: boolean;
            deletedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
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
