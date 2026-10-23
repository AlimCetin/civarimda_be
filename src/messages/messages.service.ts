import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import { Conversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';
import { Notification } from '../entities/notification.entity';
import { User } from '../entities/user.entity';
import { RedisService } from '../common/redis/redis.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Conversation) private conversationRepository: Repository<Conversation>,
    @InjectRepository(Message) private messageRepository: Repository<Message>,
    @InjectRepository(Notification) private notificationRepository: Repository<Notification>,
    @InjectRepository(User) private userRepository: Repository<User>,
    private readonly redisService: RedisService,
  ) {}

  async getConversations(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const maxLimit = Math.min(limit, 50);

    const conversations = await this.conversationRepository
      .createQueryBuilder('c')
      .where(':userId = ANY(c.participants)', { userId })
      .andWhere('c.deletedAt IS NULL')
      .orderBy('c.lastMessageAt', 'DESC')
      .skip(skip)
      .take(maxLimit)
      .getMany();

    const conversationIds = conversations.map((c) => c.id);
    const unreadCountsMap: Record<string, number> = {};

    if (conversationIds.length > 0) {
      const unreadMessages = await this.messageRepository
        .createQueryBuilder('m')
        .where('m.conversationId IN (:...conversationIds)', { conversationIds })
        .andWhere('m.read = false')
        .andWhere('m.senderId != :userId', { userId })
        .andWhere('m.deletedAt IS NULL')
        .select(['m.conversationId'])
        .getMany();

      unreadMessages.forEach((m) => {
        unreadCountsMap[m.conversationId] = (unreadCountsMap[m.conversationId] || 0) + 1;
      });
    }

    // Collect all participant IDs
    const allParticipantIds = Array.from(
      new Set(conversations.flatMap((c) => c.participants || []).filter(Boolean)),
    );
    let participantMap = new Map<string, User>();
    if (allParticipantIds.length > 0) {
      const users = await this.userRepository.find({
        where: { id: In(allParticipantIds), deletedAt: IsNull() },
        select: ['id', 'fullName', 'avatar'],
      });
      participantMap = new Map(users.map((u) => [u.id, u]));
    }

    // Collect lastMessage IDs
    const lastMessageIds = conversations.map((c) => c.lastMessage).filter(Boolean) as string[];
    let messageMap = new Map<string, Message>();
    if (lastMessageIds.length > 0) {
      const messages = await this.messageRepository.find({
        where: { id: In(lastMessageIds), deletedAt: IsNull() },
      });
      messageMap = new Map(messages.map((m) => [m.id, m]));
    }

    const filteredConversations = conversations
      .map((conv) => {
        const validParticipants = (conv.participants || []).filter((id) => id !== userId);
        const formattedParticipants = validParticipants.map((id) => {
          const u = participantMap.get(id);
          return {
            id,
            _id: id,
            fullName: u?.fullName || '',
            username: u?.fullName || '',
            avatar: u?.avatar || null,
          };
        });

        let formattedLastMessage: any = null;
        if (conv.lastMessage) {
          const msg = messageMap.get(conv.lastMessage);
          if (msg) {
            formattedLastMessage = {
              id: msg.id,
              _id: msg.id,
              text: msg.text || '',
              createdAt: msg.createdAt || conv.lastMessageAt,
            };
          }
        }

        const unreadCount = unreadCountsMap[conv.id] || 0;

        return {
          id: conv.id,
          _id: conv.id,
          participants: formattedParticipants,
          lastMessage: formattedLastMessage,
          lastMessageAt: conv.lastMessageAt || conv.createdAt,
          updatedAt: conv.lastMessageAt || conv.createdAt,
          createdAt: conv.createdAt,
          unreadCount,
        };
      })
      .filter((conv) => conv.participants.length > 0);

    return {
      conversations: filteredConversations,
      pagination: {
        page,
        limit: maxLimit,
        hasMore: conversations.length === maxLimit,
      },
    };
  }

  async getMessages(conversationId: string, userId: string, page: number = 1, limit: number = 20) {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId, deletedAt: IsNull() },
    });

    if (!conversation || !conversation.participants?.includes(userId)) {
      throw new NotFoundException('Conversation not found');
    }

    const skip = (page - 1) * limit;
    const maxLimit = Math.min(limit, 50);

    const messages = await this.messageRepository.find({
      where: { conversationId, deletedAt: IsNull() },
      order: { createdAt: 'ASC' },
      skip,
      take: maxLimit,
    });

    const senderIds = Array.from(new Set(messages.map((m) => m.senderId)));
    let senderMap = new Map<string, User>();
    if (senderIds.length > 0) {
      const senders = await this.userRepository.find({
        where: { id: In(senderIds), deletedAt: IsNull() },
        select: ['id', 'fullName', 'avatar'],
      });
      senderMap = new Map(senders.map((s) => [s.id, s]));
    }

    const validMessages = messages.map((msg) => {
      const sender = senderMap.get(msg.senderId);
      return {
        id: msg.id,
        _id: msg.id,
        conversationId: msg.conversationId,
        senderId: msg.senderId,
        receiverId: '',
        text: msg.text || '',
        read: msg.read || false,
        createdAt: msg.createdAt,
        sender: {
          id: msg.senderId,
          _id: msg.senderId,
          fullName: sender?.fullName || '',
          username: sender?.fullName || '',
          avatar: sender?.avatar || null,
        },
      };
    });

    return {
      messages: validMessages,
      pagination: {
        page,
        limit: maxLimit,
        hasMore: messages.length === maxLimit,
      },
    };
  }

  async sendMessage(senderId: string, receiverId: string, text: string) {
    let conversation = await this.conversationRepository
      .createQueryBuilder('c')
      .where(':senderId = ANY(c.participants) AND :receiverId = ANY(c.participants)', {
        senderId,
        receiverId,
      })
      .andWhere('c.deletedAt IS NULL')
      .getOne();

    if (!conversation) {
      conversation = this.conversationRepository.create({
        participants: [senderId, receiverId],
        lastMessageAt: new Date(),
      });
      await this.conversationRepository.save(conversation);
    }

    const message = this.messageRepository.create({
      conversationId: conversation.id,
      senderId,
      text,
      read: false,
    });
    await this.messageRepository.save(message);

    conversation.lastMessage = message.id;
    conversation.lastMessageAt = new Date();
    await this.conversationRepository.save(conversation);

    const notification = this.notificationRepository.create({
      userId: receiverId,
      fromUserId: senderId,
      type: 'message',
    });
    await this.notificationRepository.save(notification);

    const cacheKey = `notification:unread:${receiverId}`;
    const cached = await this.redisService.get(cacheKey);
    if (cached !== null) {
      await this.redisService.incr(cacheKey);
      await this.redisService.expire(cacheKey, 60);
    } else {
      await this.redisService.set(cacheKey, '1', 60);
    }

    await this.redisService.del(`messages:unread:${receiverId}`);

    const sender = await this.userRepository.findOne({
      where: { id: senderId },
      select: ['id', 'fullName', 'avatar'],
    });

    return {
      id: message.id,
      _id: message.id,
      conversationId: conversation.id,
      senderId,
      receiverId,
      text: message.text,
      read: message.read,
      createdAt: message.createdAt,
      sender: {
        id: senderId,
        _id: senderId,
        fullName: sender?.fullName || '',
        username: sender?.fullName || '',
        avatar: sender?.avatar || null,
      },
    };
  }

  async markAsRead(conversationId: string, userId: string) {
    const result = await this.messageRepository
      .createQueryBuilder()
      .update(Message)
      .set({ read: true })
      .where('conversationId = :conversationId', { conversationId })
      .andWhere('senderId != :userId', { userId })
      .andWhere('read = false')
      .andWhere('deletedAt IS NULL')
      .execute();

    await this.redisService.del(`messages:unread:${userId}`);
    return { modifiedCount: result.affected || 0 };
  }

  async getUnreadMessagesCount(userId: string): Promise<number> {
    const cacheKey = `messages:unread:${userId}`;

    const cached = await this.redisService.get(cacheKey);
    if (cached !== null) {
      return parseInt(cached);
    }

    const conversations = await this.conversationRepository
      .createQueryBuilder('c')
      .where(':userId = ANY(c.participants)', { userId })
      .andWhere('c.deletedAt IS NULL')
      .select(['c.id'])
      .getMany();

    const conversationIds = conversations.map((c) => c.id);
    if (conversationIds.length === 0) {
      await this.redisService.set(cacheKey, '0', 60);
      return 0;
    }

    const unreadMessages = await this.messageRepository
      .createQueryBuilder('m')
      .where('m.conversationId IN (:...conversationIds)', { conversationIds })
      .andWhere('m.read = false')
      .andWhere('m.senderId != :userId', { userId })
      .andWhere('m.deletedAt IS NULL')
      .select(['m.conversationId'])
      .getMany();

    const uniqueConversations = new Set(unreadMessages.map((m) => m.conversationId));
    const count = uniqueConversations.size;

    await this.redisService.set(cacheKey, count.toString(), 60);
    return count;
  }
}
