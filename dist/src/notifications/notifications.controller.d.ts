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
    markAsRead(id: string, user: User): Promise<{
        message: string;
    }>;
    markAllAsRead(user: User): Promise<{
        message: string;
    }>;
}
