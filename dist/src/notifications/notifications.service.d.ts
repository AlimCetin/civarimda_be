import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { User } from '../entities/user.entity';
import { RedisService } from '../common/redis/redis.service';
export declare class NotificationsService {
    private notificationRepository;
    private userRepository;
    private readonly redisService;
    constructor(notificationRepository: Repository<Notification>, userRepository: Repository<User>, redisService: RedisService);
    getUserNotifications(userId: string, page?: number, limit?: number): Promise<{
        notifications: {
            id: string;
            _id: string;
            type: string;
            fromUser: {
                id: string;
                _id: string;
                username: string;
                fullName: string;
                avatar: string | null;
            };
            postId: string | null;
            postOwnerName: string | null;
            isFollowerNotification: boolean;
            read: boolean;
            createdAt: Date;
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
