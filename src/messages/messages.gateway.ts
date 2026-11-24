import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { MessagesService } from './messages.service';

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SOCKET_MSG_WINDOW_MS = 10_000;
const SOCKET_MSG_MAX_COUNT = 20;

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:19006', 'http://10.0.2.2:3000'],
    credentials: true,
  },
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Soket bazlı basit rate-limit takibi (spam koruması)
  private readonly messageTimestamps = new Map<string, number[]>();

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

      const payload = this.jwtService.verify<{ id: string; type?: string }>(token, { secret });
      if (payload.type === 'refresh') {
        client.disconnect();
        return;
      }

      const user = await this.userRepository.findOne({
        where: { id: payload.id, deletedAt: IsNull() },
      });
      if (
        !user ||
        user.isPermanentlyBanned ||
        (user.bannedUntil && new Date(user.bannedUntil) > new Date())
      ) {
        client.disconnect();
        return;
      }

      client.data.userId = user.id;
      client.join(`user_${user.id}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.messageTimestamps.delete(client.id);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(client: Socket, data: { receiverId?: string; text?: string }) {
    const senderId = client.data?.userId as string | undefined;
    if (!senderId) {
      throw new WsException('Yetkisiz WebSocket bağlantısı.');
    }

    if (!data || typeof data.receiverId !== 'string' || !UUID_V4_REGEX.test(data.receiverId)) {
      throw new WsException('Geçersiz alıcı kimliği.');
    }

    const trimmedText = typeof data.text === 'string' ? data.text.trim() : '';
    if (!trimmedText || trimmedText.length > 2000) {
      throw new WsException('Mesaj 1 ile 2000 karakter arasında olmalıdır.');
    }

    // Rate limiting kontrolü
    const now = Date.now();
    const recent = (this.messageTimestamps.get(client.id) || []).filter(
      (ts) => now - ts < SOCKET_MSG_WINDOW_MS,
    );
    if (recent.length >= SOCKET_MSG_MAX_COUNT) {
      throw new WsException('Çok hızlı mesaj gönderiyorsunuz. Lütfen bekleyin.');
    }
    recent.push(now);
    this.messageTimestamps.set(client.id, recent);

    const message = await this.messagesService.sendMessage(senderId, data.receiverId, trimmedText);
    this.server.to(`user_${data.receiverId}`).emit('newMessage', message);
    return message;
  }
}
