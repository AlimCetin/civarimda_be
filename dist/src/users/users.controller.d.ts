import { UsersService } from './users.service';
import { User } from '../entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Types } from 'mongoose';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    getMe(user: User): Promise<any>;
    search(query: string): Promise<any>;
    getBlocked(user: User): Promise<string[]>;
    getUser(userId: string, user: User): Promise<any>;
    getFollowers(userId: string, user: User): Promise<{
        id: any;
        fullName: any;
        avatar: any;
        isFollowing: boolean;
    }[]>;
    getFollowing(userId: string, user: User): Promise<{
        id: any;
        fullName: any;
        avatar: any;
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
        followerCount: number;
        followingCount: number;
        fullName: string;
        avatar: string;
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
        _id: Types.ObjectId;
        $locals: Record<string, unknown>;
        $op: "save" | "validate" | "remove" | null;
        $where: Record<string, unknown>;
        baseModelName?: string;
        collection: import("mongoose").Collection;
        db: import("mongoose").Connection;
        errors?: import("mongoose").Error.ValidationError;
        isNew: boolean;
        schema: import("mongoose").Schema;
        __v: number;
    }>;
    deleteAccount(user: User): Promise<{
        message: string;
    }>;
}
