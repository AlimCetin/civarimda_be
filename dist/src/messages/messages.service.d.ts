import { Repository } from 'typeorm';
import { Conversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';
import { Notification } from '../entities/notification.entity';
import { User } from '../entities/user.entity';
import { RedisService } from '../common/redis/redis.service';
export declare class MessagesService {
    private conversationRepository;
    private messageRepository;
    private notificationRepository;
    private userRepository;
    private readonly redisService;
    constructor(conversationRepository: Repository<Conversation>, messageRepository: Repository<Message>, notificationRepository: Repository<Notification>, userRepository: Repository<User>, redisService: RedisService);
    getConversations(userId: string, page?: number, limit?: number): Promise<{
        conversations: {
            id: string;
            _id: string;
            participants: {
                id: string;
                _id: string;
                fullName: string;
                username: string;
                avatar: string | null;
            }[];
            lastMessage: any;
            lastMessageAt: Date;
            updatedAt: Date;
            createdAt: Date;
            unreadCount: number;
        }[];
        pagination: {
            page: number;
            limit: number;
            hasMore: boolean;
        };
    }>;
    getMessages(conversationId: string, userId: string, page?: number, limit?: number): Promise<{
        messages: {
            id: string;
            _id: string;
            conversationId: string;
            senderId: string;
            receiverId: string;
            text: string;
            read: boolean;
            createdAt: Date;
            sender: {
                id: string;
                _id: string;
                fullName: string;
                username: string;
                avatar: string | null;
            };
        }[];
        pagination: {
            page: number;
            limit: number;
            hasMore: boolean;
        };
    }>;
    sendMessage(senderId: string, receiverId: string, text: string): Promise<{
        id: string;
        _id: string;
        conversationId: string;
        senderId: string;
        receiverId: string;
        text: string;
        read: boolean;
        createdAt: Date;
        sender: {
            id: string;
            _id: string;
            fullName: string;
            username: string;
            avatar: string | null;
        };
    }>;
    markAsRead(conversationId: string, userId: string): Promise<{
        modifiedCount: number;
    }>;
    getUnreadMessagesCount(userId: string): Promise<number>;
}
