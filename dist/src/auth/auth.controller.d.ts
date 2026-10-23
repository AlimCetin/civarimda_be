import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto/auth.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { User } from '../entities/user.entity';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
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
    refresh(dto: RefreshTokenDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    getMe(user: User): Promise<User>;
    changePassword(dto: ChangePasswordDto, user: User): Promise<{
        message: string;
    }>;
    logout(user: User): Promise<{
        message: string;
    }>;
}
