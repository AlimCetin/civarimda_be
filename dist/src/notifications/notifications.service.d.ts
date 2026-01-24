import { Model } from 'mongoose';
import { Notification } from '../entities/notification.entity';
import { RedisService } from '../common/redis/redis.service';
export declare class NotificationsService {
    private notificationModel;
    private readonly redisService;
    constructor(notificationModel: Model<Notification>, redisService: RedisService);
    getUserNotifications(userId: string, page?: number, limit?: number): Promise<{
        notifications: {
            id: any;
            type: any;
            fromUser: {
                id: any;
                username: any;
                fullName: any;
                avatar: any;
            };
            postId: any;
            postOwnerName: any;
            isFollowerNotification: any;
            read: any;
            createdAt: any;
        }[];
        pagination: {
            page: number;
            limit: number;
            hasMore: boolean;
        };
    }>;
    markAsRead(notificationId: string, userId: string): Promise<void>;
    markAllAsRead(userId: string): Promise<void>;
    getUnreadCount(userId: string): Promise<number>;
    incrementUnreadCount(userId: string): Promise<void>;
    invalidateUnreadCount(userId: string): Promise<void>;
}
