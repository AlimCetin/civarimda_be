import { PostsService } from './posts.service';
import { User } from '../entities/user.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { AddCommentDto } from './dto/add-comment.dto';
import { UpdateVisibilityDto } from './dto/update-visibility.dto';
export declare class PostsController {
    private postsService;
    constructor(postsService: PostsService);
    uploadMedia(file: Express.Multer.File): Promise<{
        url: string;
    }>;
    create(file: Express.Multer.File, body: CreatePostDto, user: User): Promise<{
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
    getLikes(postId: string, user: User, page: number, limit: number): Promise<{
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
    getFeed(user: User, page: number, limit: number): Promise<any>;
    getUserPosts(userId: string, user: User, page: number, limit: number): Promise<{
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
    like(postId: string, user: User): Promise<{
        message: string;
    }>;
    unlike(postId: string, user: User): Promise<{
        message: string;
    }>;
    getComments(postId: string, page: number, limit: number): Promise<{
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
    addComment(postId: string, body: AddCommentDto, user: User): Promise<{
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
    savePost(postId: string, user: User): Promise<{
        message: string;
    }>;
    unsavePost(postId: string, user: User): Promise<{
        message: string;
    }>;
    getSavedPosts(user: User, page: number, limit: number): Promise<{
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
    getPostForShare(postId: string, user: User): Promise<{
        postId: string;
        image: string | null;
        caption: string;
    }>;
    getPost(postId: string, user: User): Promise<{
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
    hidePost(postId: string, user: User): Promise<{
        message: string;
    }>;
    unhidePost(postId: string, user: User): Promise<{
        message: string;
    }>;
    updateVisibility(postId: string, body: UpdateVisibilityDto, user: User): Promise<{
        message: string;
        update: {
            isPrivate?: boolean;
            isHidden?: boolean;
            hiddenFromFollowers?: string[];
        };
    }>;
    deletePost(postId: string, user: User): Promise<{
        message: string;
    }>;
}
