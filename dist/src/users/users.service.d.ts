import { Model } from 'mongoose';
import { User } from '../entities/user.entity';
import { UserCredentials } from '../entities/user-credentials.entity';
import { Post } from '../entities/post.entity';
import { Comment } from '../entities/comment.entity';
import { Conversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';
import { Notification } from '../entities/notification.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RedisService } from '../common/redis/redis.service';
export declare class UsersService {
    private userModel;
    private credentialsModel;
    private postModel;
    private commentModel;
    private conversationModel;
    private messageModel;
    private notificationModel;
    private readonly redisService;
    constructor(userModel: Model<User>, credentialsModel: Model<UserCredentials>, postModel: Model<Post>, commentModel: Model<Comment>, conversationModel: Model<Conversation>, messageModel: Model<Message>, notificationModel: Model<Notification>, redisService: RedisService);
    findById(userId: string, currentUserId?: string): Promise<any>;
    search(query: string): Promise<any>;
    follow(userId: string, currentUserId: string): Promise<{
        message: string;
    }>;
    unfollow(userId: string, currentUserId: string): Promise<{
        message: string;
    }>;
    block(userId: string, currentUserId: string): Promise<{
        message: string;
    }>;
    unblock(userId: string, currentUserId: string): Promise<{
        message: string;
    }>;
    updateProfile(userId: string, data: UpdateProfileDto): Promise<{
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
        _id: import("mongoose").Types.ObjectId;
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
    getBlockedUsers(userId: string): Promise<string[]>;
    getFollowers(userId: string, currentUserId?: string): Promise<{
        id: any;
        fullName: any;
        avatar: any;
        isFollowing: boolean;
    }[]>;
    getFollowing(userId: string, currentUserId?: string): Promise<{
        id: any;
        fullName: any;
        avatar: any;
        isFollowing: boolean;
    }[]>;
    deleteAccount(userId: string): Promise<{
        message: string;
    }>;
    private invalidateFeedCache;
}
