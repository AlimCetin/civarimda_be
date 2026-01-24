import { Model } from 'mongoose';
import { Types } from 'mongoose';
import { Post } from '../entities/post.entity';
import { Comment } from '../entities/comment.entity';
import { Notification } from '../entities/notification.entity';
import { User } from '../entities/user.entity';
import { Ad } from '../entities/ad.entity';
import { RedisService } from '../common/redis/redis.service';
export declare class PostsService {
    private postModel;
    private commentModel;
    private notificationModel;
    private userModel;
    private adModel;
    private readonly redisService;
    constructor(postModel: Model<Post>, commentModel: Model<Comment>, notificationModel: Model<Notification>, userModel: Model<User>, adModel: Model<Ad>, redisService: RedisService);
    create(userId: string, image: string | undefined, caption: string, isPrivate?: boolean, hiddenFromFollowers?: string[], video?: string): Promise<import("mongoose").Document<unknown, {}, Post, {}, import("mongoose").DefaultSchemaOptions> & Post & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    getLikes(postId: string, currentUserId: string, page?: number, limit?: number): Promise<{
        users: ({
            id: string;
            username: any;
            fullName: any;
            avatar: any;
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
            id: any;
            userId: any;
            user: {
                id: any;
                username: any;
                fullName: any;
                avatar: any;
            };
            image: any;
            video: any;
            caption: any;
            likeCount: any;
            commentCount: any;
            isLiked: any;
            isSaved: boolean;
            createdAt: any;
        }[];
        pagination: {
            page: number;
            limit: number;
            hasMore: boolean;
        };
    }>;
    getPostById(postId: string, currentUserId: string): Promise<{
        id: string;
        userId: any;
        user: {
            id: any;
            username: any;
            fullName: any;
            avatar: any;
        };
        image: string;
        video: any;
        caption: string;
        likeCount: number;
        commentCount: number;
        isLiked: boolean;
        isSaved: boolean;
        isHidden: boolean;
        isPrivate: boolean;
        hiddenFromFollowers: any[];
        createdAt: any;
    }>;
    like(postId: string, userId: string): Promise<{
        message: string;
    }>;
    unlike(postId: string, userId: string): Promise<{
        message: string;
    }>;
    getComments(postId: string, page?: number, limit?: number): Promise<{
        comments: {
            id: any;
            userId: any;
            user: {
                id: any;
                username: any;
                fullName: any;
                avatar: any;
            };
            text: any;
            createdAt: any;
        }[];
        pagination: {
            page: number;
            limit: number;
            hasMore: boolean;
        };
    }>;
    addComment(postId: string, userId: string, text: string): Promise<{
        id: string;
        userId: any;
        user: {
            id: any;
            username: any;
            fullName: any;
            avatar: any;
        };
        text: string;
        createdAt: any;
    }>;
    savePost(postId: string, userId: string): Promise<{
        message: string;
    }>;
    unsavePost(postId: string, userId: string): Promise<{
        message: string;
    }>;
    getSavedPosts(userId: string, page?: number, limit?: number): Promise<{
        posts: {
            id: any;
            userId: any;
            user: {
                id: any;
                username: any;
                fullName: any;
                avatar: any;
            };
            image: any;
            video: any;
            caption: any;
            likeCount: any;
            commentCount: any;
            isLiked: any;
            isSaved: boolean;
            isHidden: any;
            isPrivate: any;
            hiddenFromFollowers: any;
            createdAt: any;
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
        update: any;
    }>;
    sharePost(postId: string, userId: string, receiverId: string): Promise<{
        postId: string;
        image: string;
        caption: string;
    }>;
}
