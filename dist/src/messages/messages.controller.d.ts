import { MessagesService } from './messages.service';
import { User } from '../entities/user.entity';
export declare class MessagesController {
    private messagesService;
    constructor(messagesService: MessagesService);
    getConversations(user: User, page: number, limit: number): Promise<{
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
    getMessages(conversationId: string, user: User, page: number, limit: number): Promise<{
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
    sendMessage(body: {
        receiverId: string;
        text: string;
    }, user: User): Promise<{
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
    markAsRead(conversationId: string, user: User): Promise<{
        message: string;
        modifiedCount: number;
    }>;
    getUnreadCount(user: User): Promise<{
        count: number;
    }>;
}
