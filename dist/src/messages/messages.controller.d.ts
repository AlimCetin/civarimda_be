import { MessagesService } from './messages.service';
import { User } from '../entities/user.entity';
export declare class MessagesController {
    private messagesService;
    constructor(messagesService: MessagesService);
    getConversations(user: User, page: number, limit: number): Promise<{
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
    getMessages(conversationId: string, user: User, page: number, limit: number): Promise<{
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
    sendMessage(body: {
        receiverId: string;
        text: string;
    }, user: User): Promise<{
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
    markAsRead(conversationId: string, user: User): Promise<{
        message: string;
        modifiedCount: number;
    }>;
    getUnreadCount(user: User): Promise<{
        count: number;
    }>;
}
