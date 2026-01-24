import { OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { User } from '../entities/user.entity';
import { MessagesService } from './messages.service';
export declare class MessagesGateway implements OnGatewayConnection {
    private jwtService;
    private userModel;
    private messagesService;
    private configService;
    server: Server;
    constructor(jwtService: JwtService, userModel: Model<User>, messagesService: MessagesService, configService: ConfigService);
    handleConnection(client: Socket): Promise<void>;
    handleMessage(client: Socket, data: {
        receiverId: string;
        text: string;
    }): Promise<{
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
}
