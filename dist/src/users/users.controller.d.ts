import { UsersService } from './users.service';
import { User } from '../entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    getMe(user: User): Promise<{
        id: string;
        _id: string;
        followerCount: number;
        followingCount: number;
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
    }>;
    search(query: string): Promise<any>;
    getBlocked(user: User): Promise<User[]>;
    getUser(userId: string, user: User): Promise<any>;
    getFollowers(userId: string, user: User): Promise<{
        id: string;
        _id: string;
        fullName: string;
        avatar: string | null;
        isFollowing: boolean;
    }[]>;
    getFollowing(userId: string, user: User): Promise<{
        id: string;
        _id: string;
        fullName: string;
        avatar: string | null;
        isFollowing: boolean;
    }[]>;
    follow(userId: string, user: User): Promise<{
        message: string;
    }>;
    unfollow(userId: string, user: User): Promise<{
        message: string;
    }>;
    block(userId: string, user: User): Promise<{
        message: string;
    }>;
    unblock(userId: string, user: User): Promise<{
        message: string;
    }>;
    updateProfile(data: UpdateProfileDto, user: User): Promise<{
        id: string;
        _id: string;
        followerCount: number;
        followingCount: number;
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
    } | {
        id: string;
        _id: string;
        followerCount: number;
        followingCount: number;
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
    }>;
    deleteAccount(user: User): Promise<{
        message: string;
    }>;
}
