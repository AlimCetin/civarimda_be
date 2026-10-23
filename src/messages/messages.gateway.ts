import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { MessagesService } from './messages.service';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:19006', 'http://10.0.2.2:3000'],
    credentials: true,
  },
})
export class MessagesGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private jwtService: JwtService,
    @InjectRepository(User) private userRepository: Repository<User>,
    private messagesService: MessagesService,
    private configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
      if (!token) {
        client.disconnect();
        return;
      }

      const secret = this.configService.get<string>('JWT_SECRET');
      if (!secret) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, { secret });
      const user = await this.userRepository.findOne({ where: { id: payload.id } });
      if (!user) {
        client.disconnect();
        return;
      }

      client.data.userId = user.id;
      client.join(`user_${user.id}`);
    } catch (error) {
      client.disconnect();
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(client: Socket, data: { receiverId: string; text: string }) {
    const message = await this.messagesService.sendMessage(
      client.data.userId,
      data.receiverId,
      data.text,
    );
    this.server.to(`user_${data.receiverId}`).emit('newMessage', message);
    return message;
  }
}
