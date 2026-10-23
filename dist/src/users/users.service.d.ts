import { Repository } from 'typeorm';
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
    private userRepository;
    private credentialsRepository;
    private postRepository;
    private commentRepository;
    private conversationRepository;
    private messageRepository;
    private notificationRepository;
    private readonly redisService;
    constructor(userRepository: Repository<User>, credentialsRepository: Repository<UserCredentials>, postRepository: Repository<Post>, commentRepository: Repository<Comment>, conversationRepository: Repository<Conversation>, messageRepository: Repository<Message>, notificationRepository: Repository<Notification>, redisService: RedisService);
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
    getBlockedUsers(userId: string): Promise<User[]>;
    getFollowers(userId: string, currentUserId?: string): Promise<{
        id: string;
        _id: string;
        fullName: string;
        avatar: string | null;
        isFollowing: boolean;
    }[]>;
    getFollowing(userId: string, currentUserId?: string): Promise<{
        id: string;
        _id: string;
        fullName: string;
        avatar: string | null;
        isFollowing: boolean;
    }[]>;
    deleteAccount(userId: string): Promise<{
        message: string;
    }>;
    private invalidateFeedCache;
}
