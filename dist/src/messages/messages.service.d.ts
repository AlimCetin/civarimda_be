import { Model } from 'mongoose';
import { Conversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';
import { Notification } from '../entities/notification.entity';
import { RedisService } from '../common/redis/redis.service';
export declare class MessagesService {
    private conversationModel;
    private messageModel;
    private notificationModel;
    private readonly redisService;
    constructor(conversationModel: Model<Conversation>, messageModel: Model<Message>, notificationModel: Model<Notification>, redisService: RedisService);
    getConversations(userId: string, page?: number, limit?: number): Promise<{
        conversations: ({
            id: any;
            participants: any;
            lastMessage: any;
            lastMessageAt: any;
            updatedAt: any;
            createdAt: any;
            unreadCount: number;
        } | null)[];
        pagination: {
            page: number;
            limit: number;
            hasMore: boolean;
        };
    }>;
    getMessages(conversationId: string, userId: string, page?: number, limit?: number): Promise<{
        messages: {
            id: any;
            conversationId: any;
            senderId: any;
            receiverId: string;
            text: any;
            read: any;
            createdAt: any;
            sender: {
                id: any;
                fullName: any;
                username: any;
                avatar: any;
            };
        }[];
        pagination: {
            page: number;
            limit: number;
            hasMore: boolean;
        };
    }>;
    sendMessage(senderId: string, receiverId: string, text: string): Promise<{
        id: any;
        conversationId: string;
        senderId: any;
        receiverId: string;
        text: any;
        read: any;
        createdAt: Date;
        sender: {
            id: any;
            fullName: any;
            username: any;
            avatar: any;
        };
    }>;
    markAsRead(conversationId: string, userId: string): Promise<{
        modifiedCount: number;
    }>;
    getUnreadMessagesCount(userId: string): Promise<number>;
}
