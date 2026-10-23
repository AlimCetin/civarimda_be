"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const conversation_entity_1 = require("../entities/conversation.entity");
const message_entity_1 = require("../entities/message.entity");
const notification_entity_1 = require("../entities/notification.entity");
const user_entity_1 = require("../entities/user.entity");
const redis_service_1 = require("../common/redis/redis.service");
let MessagesService = class MessagesService {
    conversationRepository;
    messageRepository;
    notificationRepository;
    userRepository;
    redisService;
    constructor(conversationRepository, messageRepository, notificationRepository, userRepository, redisService) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.redisService = redisService;
    }
    async getConversations(userId, page = 1, limit = 20) {
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
        const unreadCountsMap = {};
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
        const allParticipantIds = Array.from(new Set(conversations.flatMap((c) => c.participants || []).filter(Boolean)));
        let participantMap = new Map();
        if (allParticipantIds.length > 0) {
            const users = await this.userRepository.find({
                where: { id: (0, typeorm_2.In)(allParticipantIds), deletedAt: (0, typeorm_2.IsNull)() },
                select: ['id', 'fullName', 'avatar'],
            });
            participantMap = new Map(users.map((u) => [u.id, u]));
        }
        const lastMessageIds = conversations.map((c) => c.lastMessage).filter(Boolean);
        let messageMap = new Map();
        if (lastMessageIds.length > 0) {
            const messages = await this.messageRepository.find({
                where: { id: (0, typeorm_2.In)(lastMessageIds), deletedAt: (0, typeorm_2.IsNull)() },
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
            let formattedLastMessage = null;
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
    async getMessages(conversationId, userId, page = 1, limit = 20) {
        const conversation = await this.conversationRepository.findOne({
            where: { id: conversationId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!conversation || !conversation.participants?.includes(userId)) {
            throw new common_1.NotFoundException('Conversation not found');
        }
        const skip = (page - 1) * limit;
        const maxLimit = Math.min(limit, 50);
        const messages = await this.messageRepository.find({
            where: { conversationId, deletedAt: (0, typeorm_2.IsNull)() },
            order: { createdAt: 'ASC' },
            skip,
            take: maxLimit,
        });
        const senderIds = Array.from(new Set(messages.map((m) => m.senderId)));
        let senderMap = new Map();
        if (senderIds.length > 0) {
            const senders = await this.userRepository.find({
                where: { id: (0, typeorm_2.In)(senderIds), deletedAt: (0, typeorm_2.IsNull)() },
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
    async sendMessage(senderId, receiverId, text) {
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
        }
        else {
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
    async markAsRead(conversationId, userId) {
        const result = await this.messageRepository
            .createQueryBuilder()
            .update(message_entity_1.Message)
            .set({ read: true })
            .where('conversationId = :conversationId', { conversationId })
            .andWhere('senderId != :userId', { userId })
            .andWhere('read = false')
            .andWhere('deletedAt IS NULL')
            .execute();
        await this.redisService.del(`messages:unread:${userId}`);
        return { modifiedCount: result.affected || 0 };
    }
    async getUnreadMessagesCount(userId) {
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
};
exports.MessagesService = MessagesService;
exports.MessagesService = MessagesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(conversation_entity_1.Conversation)),
    __param(1, (0, typeorm_1.InjectRepository)(message_entity_1.Message)),
    __param(2, (0, typeorm_1.InjectRepository)(notification_entity_1.Notification)),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        redis_service_1.RedisService])
], MessagesService);
//# sourceMappingURL=messages.service.js.map