import { Repository } from 'typeorm';
import { Post } from '../entities/post.entity';
import { Comment } from '../entities/comment.entity';
import { Notification } from '../entities/notification.entity';
import { User } from '../entities/user.entity';
import { Ad } from '../entities/ad.entity';
import { RedisService } from '../common/redis/redis.service';
export declare class PostsService {
    private postRepository;
    private commentRepository;
    private notificationRepository;
    private userRepository;
    private adRepository;
    private readonly redisService;
    constructor(postRepository: Repository<Post>, commentRepository: Repository<Comment>, notificationRepository: Repository<Notification>, userRepository: Repository<User>, adRepository: Repository<Ad>, redisService: RedisService);
    create(userId: string, image: string | undefined, caption: string, isPrivate?: boolean, hiddenFromFollowers?: string[], video?: string): Promise<{
        id: string;
        _id: string;
        userId: string;
        image: string | null;
        video?: string | null;
        caption: string;
        likes: string[];
        commentCount: number;
        isHidden: boolean;
        isPrivate: boolean;
        hiddenFromFollowers: string[];
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getLikes(postId: string, currentUserId: string, page?: number, limit?: number): Promise<{
        users: ({
            id: string;
            _id: string;
            username: string;
            fullName: string;
            avatar: string | null;
        } | null)[];
        pagination: {
            page: number;
            limit: number;
            hasMore: boolean;
        };
    }>;
    getFeed(userId: string, page?: number, limit?: number): Promise<any>;
    invalidateFeedCache(userId: string): Promise<void>;
    getUserPosts(userId: string, currentUserId?: string, page?: number, limit?: number): Promise<{
        posts: {
            id: string;
            _id: string;
            userId: string;
            user: {
                id: string;
                _id: string;
                username: string;
                fullName: string;
                avatar: string | null;
            };
            image: string | null;
            video: string | undefined;
            caption: string;
            likeCount: number;
            commentCount: number;
            isLiked: boolean;
            isSaved: boolean;
            createdAt: Date;
        }[];
        pagination: {
            page: number;
            limit: number;
            hasMore: boolean;
        };
    }>;
    getPostById(postId: string, currentUserId: string): Promise<{
        id: string;
        _id: string;
        userId: string;
        user: {
            id: string;
            _id: string;
            username: string;
            fullName: string;
            avatar: string | null;
        };
        image: string | null;
        video: string | undefined;
        caption: string;
        likeCount: number;
        commentCount: number;
        isLiked: boolean;
        isSaved: boolean;
        isHidden: boolean;
        isPrivate: boolean;
        hiddenFromFollowers: string[];
        createdAt: Date;
    }>;
    like(postId: string, userId: string): Promise<{
        message: string;
    }>;
    unlike(postId: string, userId: string): Promise<{
        message: string;
    }>;
    getComments(postId: string, page?: number, limit?: number): Promise<{
        comments: {
            id: string;
            _id: string;
            userId: string;
            user: {
                id: string;
                _id: string;
                username: string;
                fullName: string;
                avatar: string | null;
            };
            text: string;
            createdAt: Date;
        }[];
        pagination: {
            page: number;
            limit: number;
            hasMore: boolean;
        };
    }>;
    addComment(postId: string, userId: string, text: string): Promise<{
        id: string;
        _id: string;
        userId: string;
        user: {
            id: string;
            _id: string;
            username: string;
            fullName: string;
            avatar: string | null;
        };
        text: string;
        createdAt: Date;
    }>;
    savePost(postId: string, userId: string): Promise<{
        message: string;
    }>;
    unsavePost(postId: string, userId: string): Promise<{
        message: string;
    }>;
    getSavedPosts(userId: string, page?: number, limit?: number): Promise<{
        posts: {
            id: string;
            _id: string;
            userId: string;
            user: {
                id: string;
                _id: string;
                username: string;
                fullName: string;
                avatar: string | null;
            };
            image: string | null;
            video: string | undefined;
            caption: string;
            likeCount: number;
            commentCount: number;
            isLiked: boolean;
            isSaved: boolean;
            isHidden: boolean;
            isPrivate: boolean;
            hiddenFromFollowers: string[];
            createdAt: Date;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasMore: boolean;
        };
    }>;
    hidePost(postId: string, userId: string): Promise<{
        message: string;
    }>;
    unhidePost(postId: string, userId: string): Promise<{
        message: string;
    }>;
    deletePost(postId: string, userId: string): Promise<{
        message: string;
    }>;
    updateVisibility(postId: string, userId: string, payload: {
        isPrivate?: boolean;
        isHidden?: boolean;
        hiddenFromFollowers?: string[];
    }): Promise<{
        message: string;
        update: {
            isPrivate?: boolean;
            isHidden?: boolean;
            hiddenFromFollowers?: string[];
        };
    }>;
    sharePost(postId: string, userId: string, receiverId: string): Promise<{
        postId: string;
        image: string | null;
        caption: string;
    }>;
}
