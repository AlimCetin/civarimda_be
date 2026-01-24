import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Conversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';
import { Notification } from '../entities/notification.entity';
import { RedisService } from '../common/redis/redis.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Conversation.name) private conversationModel: Model<Conversation>,
    @InjectModel(Message.name) private messageModel: Model<Message>,
    @InjectModel(Notification.name) private notificationModel: Model<Notification>,
    private readonly redisService: RedisService,
  ) {}

  async getConversations(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const maxLimit = Math.min(limit, 50);
    
    const conversations = await this.conversationModel.find({ 
      participants: userId,
      deletedAt: null, // Soft delete kontrolü
    })
      .populate({
        path: 'participants',
        select: 'fullName avatar',
        match: { deletedAt: null }, // Silinmemiş kullanıcıları getir
      })
      .populate({
        path: 'lastMessage',
        match: { deletedAt: null }, // Silinmemiş mesajları getir
      })
      .select('participants lastMessage lastMessageAt createdAt')
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(maxLimit)
      .lean();
    
    // Tüm conversation ID'lerini topla
    const conversationIds = conversations.map((conv: any) => conv._id.toString());
    
    // Tüm conversation'lar için okunmamış mesaj sayılarını toplu olarak hesapla (performans için)
    // userId'yi string'e çevir (karşılaştırma için)
    const userIdStr = String(userId).trim();
    
    const unreadCountsResult = await this.messageModel.aggregate([
      {
        $match: {
          conversationId: { $in: conversationIds },
          read: false, // Okunmamış
          deletedAt: null, // Soft delete kontrolü
        },
      },
      {
        $addFields: {
          senderIdStr: { $toString: '$senderId' }, // senderId'yi string'e çevir
        },
      },
      {
        $match: {
          senderIdStr: { $ne: userIdStr }, // Kullanıcının gönderdiği mesajlar değil
        },
      },
      {
        $group: {
          _id: '$conversationId',
          count: { $sum: 1 },
        },
      },
    ]);
    
    // Conversation ID'ye göre unread count map'i oluştur
    const unreadCountsMap: Record<string, number> = {};
    unreadCountsResult.forEach((item: any) => {
      unreadCountsMap[item._id] = item.count || 0;
    });
    
    // Participants'ı filtrele ve formatla
    const filteredConversations = conversations
      .map((conv: any) => {
        // Participants'ı filtrele (null olanları çıkar)
        const validParticipants = (conv.participants || []).filter((p: any) => p !== null);
        
        // Eğer geçerli participant yoksa bu conversation'ı atla
        if (validParticipants.length === 0) {
          return null;
        }
        
        // Participants'ı formatla
        const formattedParticipants = validParticipants.map((p: any) => ({
          id: p._id?.toString() || p.toString(),
          fullName: p.fullName || '',
          username: p.fullName || '',
          avatar: p.avatar || null,
        }));
        
        // LastMessage'ı formatla
        let formattedLastMessage: any = null;
        if (conv.lastMessage && conv.lastMessage !== null) {
          formattedLastMessage = {
            id: conv.lastMessage._id?.toString() || conv.lastMessage.toString(),
            text: conv.lastMessage.text || '',
            createdAt: conv.lastMessage.createdAt || conv.lastMessageAt,
          };
        }
        
        // Okunmamış mesaj sayısını map'ten al
        const unreadCount = unreadCountsMap[conv._id.toString()] || 0;
        
        return {
          id: conv._id.toString(),
          participants: formattedParticipants,
          lastMessage: formattedLastMessage,
          lastMessageAt: conv.lastMessageAt || conv.createdAt,
          updatedAt: conv.lastMessageAt || conv.createdAt,
          createdAt: conv.createdAt,
          unreadCount: unreadCount,
        };
      })
      .filter((conv: any) => conv !== null);
    
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
    const conversation = await this.conversationModel.findOne({ 
      _id: conversationId,
      deletedAt: null, // Soft delete kontrolü
    }).lean();
    
    if (!conversation || !conversation.participants.includes(userId)) {
      throw new NotFoundException('Conversation not found');
    }
    
    const skip = (page - 1) * limit;
    const maxLimit = Math.min(limit, 50);
    
    const messages = await this.messageModel.find({ 
      conversationId,
      deletedAt: null, // Soft delete kontrolü
    })
      .populate({
        path: 'senderId',
        select: 'fullName avatar',
        match: { deletedAt: null }, // Silinmemiş kullanıcıları getir
      })
      .select('senderId text read createdAt')
      .sort({ createdAt: 1 })  // En eski en üstte, en yeni en altta (chronological order)
      .skip(skip)
      .limit(maxLimit)
      .lean();
    
    // SenderId null olan mesajları filtrele ve formatla
    const validMessages = messages
      .filter((msg: any) => msg.senderId !== null)
      .map((msg: any) => {
        const sender = msg.senderId;
        return {
          id: msg._id.toString(),
          conversationId: msg.conversationId || conversationId,
          senderId: sender._id?.toString() || sender.toString(),
          receiverId: '', // Frontend'de hesaplanacak
          text: msg.text || '',
          read: msg.read || false,
          createdAt: msg.createdAt || new Date(),
          sender: {
            id: sender._id?.toString() || sender.toString(),
            fullName: sender.fullName || '',
            username: sender.fullName || '',
            avatar: sender.avatar || null,
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
    let conversation = await this.conversationModel.findOne({
      participants: { $all: [senderId, receiverId] },
      deletedAt: null, // Soft delete kontrolü
    });

    if (!conversation) {
      conversation = await this.conversationModel.create({
        participants: [senderId, receiverId],
      });
    }

    const message = await this.messageModel.create({
      conversationId: conversation._id.toString(),
      senderId,
      text,
    });

    await this.conversationModel.updateOne(
      { _id: conversation._id },
      { lastMessage: message._id, lastMessageAt: new Date() },
    );

    // Mesaj bildirimi oluştur
    console.log('📬 Mesaj bildirimi oluşturuluyor:', { 
      receiverId, 
      fromUserId: senderId,
      conversationId: conversation._id.toString()
    });
    
    await this.notificationModel.create({
      userId: receiverId,
      fromUserId: senderId,
      type: 'message',
      // postId yok - mesaj bildirimleri için gerekli değil
    });

    // Increment notification count cache
    const cacheKey = `notification:unread:${receiverId}`;
    const cached = await this.redisService.get(cacheKey);
    if (cached !== null) {
      await this.redisService.incr(cacheKey);
      await this.redisService.expire(cacheKey, 60);
    } else {
      await this.redisService.set(cacheKey, '1', 60);
    }

    // Invalidate message unread count cache for receiver
    await this.redisService.del(`messages:unread:${receiverId}`);

    const populatedMessage = await message.populate('senderId', 'email fullName avatar');
    const msgObj = populatedMessage.toObject() as any;
    const sender = msgObj.senderId as any;
    
    // conversationId'yi response'a ekle ve senderId'yi string'e çevir
    return {
      id: msgObj._id.toString(),
      conversationId: conversation._id.toString(),
      senderId: sender?._id?.toString() || sender?.toString() || senderId,
      receiverId: receiverId,
      text: msgObj.text || text,
      read: msgObj.read || false,
      createdAt: (msgObj.createdAt || new Date()) as Date,
      sender: {
        id: sender?._id?.toString() || sender?.toString() || senderId,
        fullName: sender?.fullName || '',
        username: sender?.fullName || '',
        avatar: sender?.avatar || null,
      },
    };
  }

  async markAsRead(conversationId: string, userId: string) {
    // userId'yi string'e çevir
    const userIdStr = String(userId).trim();
    
    // Önce okunmamış mesajları bul (kullanıcının göndermediği)
    const unreadMessages = await this.messageModel.find({
      conversationId,
      read: false,
      deletedAt: null,
    }).select('senderId').lean();
    
    // Kullanıcının göndermediği mesajları filtrele
    const messagesToMark = unreadMessages.filter((msg: any) => {
      const senderIdStr = String(msg.senderId).trim();
      return senderIdStr !== userIdStr;
    });
    
    if (messagesToMark.length === 0) {
      return { modifiedCount: 0 };
    }
    
    const messageIds = messagesToMark.map((msg: any) => msg._id);
    
    // Sadece bu mesajları okundu işaretle
    const result = await this.messageModel.updateMany(
      { 
        _id: { $in: messageIds },
        read: false,
      },
      { read: true },
    );
    
    console.log('✅ Mesajlar okundu işaretlendi:', {
      conversationId,
      userId,
      modifiedCount: result.modifiedCount,
    });

    // Invalidate message unread count cache
    await this.redisService.del(`messages:unread:${userId}`);
    
    return { modifiedCount: result.modifiedCount };
  }

  async getUnreadMessagesCount(userId: string): Promise<number> {
    const cacheKey = `messages:unread:${userId}`;

    // Try to get from cache first
    const cached = await this.redisService.get(cacheKey);
    if (cached !== null) {
      return parseInt(cached);
    }

    // Okunmamış mesajı olan conversation sayısını hesapla (kaç kişiden mesaj var)
    const userIdStr = String(userId).trim();
    
    const conversations = await this.conversationModel.find({
      participants: userIdStr,
      deletedAt: null,
    }).select('_id').lean();

    const conversationIds = conversations.map((c: any) => c._id.toString());
    
    if (conversationIds.length === 0) {
      await this.redisService.set(cacheKey, '0', 60);
      return 0;
    }

    // Tüm okunmamış mesajları al
    const unreadMessages = await this.messageModel.find({
      conversationId: { $in: conversationIds },
      read: false,
      deletedAt: null,
    }).select('conversationId senderId').lean();
    
    // Kullanıcının göndermediği mesajları filtrele ve unique conversation'ları bul
    const conversationsWithUnread = new Set<string>();
    
    unreadMessages.forEach((msg: any) => {
      const senderIdStr = String(msg.senderId).trim();
      if (senderIdStr !== userIdStr) {
        // Karşıdan gelen mesaj
        conversationsWithUnread.add(String(msg.conversationId));
      }
    });

    // Kaç farklı conversation'da okunmamış mesaj var (kaç kişiden mesaj var)
    const count = conversationsWithUnread.size;

    // Cache the result (TTL: 1 minute = 60 seconds)
    await this.redisService.set(cacheKey, count.toString(), 60);

    return count;
  }
}

