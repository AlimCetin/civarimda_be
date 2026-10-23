import { OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { MessagesService } from './messages.service';
export declare class MessagesGateway implements OnGatewayConnection {
    private jwtService;
    private userRepository;
    private messagesService;
    private configService;
    server: Server;
    constructor(jwtService: JwtService, userRepository: Repository<User>, messagesService: MessagesService, configService: ConfigService);
    handleConnection(client: Socket): Promise<void>;
    handleMessage(client: Socket, data: {
        receiverId: string;
        text: string;
    }): Promise<{
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
}
