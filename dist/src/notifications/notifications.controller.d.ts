import { NotificationsService } from './notifications.service';
import { User } from '../entities/user.entity';
export declare class NotificationsController {
    private notificationsService;
    constructor(notificationsService: NotificationsService);
    getUnreadCount(user: User): Promise<{
        count: number;
    }>;
    getNotifications(user: User, page: number, limit: number): Promise<{
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
    markAsRead(id: string, user: User): Promise<{
        message: string;
    }>;
    markAllAsRead(user: User): Promise<{
        message: string;
    }>;
}
