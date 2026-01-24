import { PostsService } from './posts.service';
import { User } from '../entities/user.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { AddCommentDto } from './dto/add-comment.dto';
import { UpdateVisibilityDto } from './dto/update-visibility.dto';
import { Types } from 'mongoose';
export declare class PostsController {
    private postsService;
    constructor(postsService: PostsService);
    uploadMedia(file: Express.Multer.File): Promise<{
        url: string;
    }>;
    create(file: Express.Multer.File, body: CreatePostDto, user: User): Promise<import("mongoose").Document<unknown, {}, import("../entities/post.entity").Post, {}, import("mongoose").DefaultSchemaOptions> & import("../entities/post.entity").Post & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    getLikes(postId: string, user: User, page: number, limit: number): Promise<{
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
    getFeed(user: User, page: number, limit: number): Promise<any>;
    getUserPosts(userId: string, user: User, page: number, limit: number): Promise<{
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
    like(postId: string, user: User): Promise<{
        message: string;
    }>;
    unlike(postId: string, user: User): Promise<{
        message: string;
    }>;
    getComments(postId: string, page: number, limit: number): Promise<{
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
    addComment(postId: string, body: AddCommentDto, user: User): Promise<{
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
    savePost(postId: string, user: User): Promise<{
        message: string;
    }>;
    unsavePost(postId: string, user: User): Promise<{
        message: string;
    }>;
    getSavedPosts(user: User, page: number, limit: number): Promise<{
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
    getPostForShare(postId: string, user: User): Promise<{
        postId: string;
        image: string;
        caption: string;
    }>;
    getPost(postId: string, user: User): Promise<{
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
    hidePost(postId: string, user: User): Promise<{
        message: string;
    }>;
    unhidePost(postId: string, user: User): Promise<{
        message: string;
    }>;
    updateVisibility(postId: string, body: UpdateVisibilityDto, user: User): Promise<{
        message: string;
        update: any;
    }>;
    deletePost(postId: string, user: User): Promise<{
        message: string;
    }>;
}
