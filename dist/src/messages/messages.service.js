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
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const conversation_entity_1 = require("../entities/conversation.entity");
const message_entity_1 = require("../entities/message.entity");
const notification_entity_1 = require("../entities/notification.entity");
const redis_service_1 = require("../common/redis/redis.service");
let MessagesService = class MessagesService {
    conversationModel;
    messageModel;
    notificationModel;
    redisService;
    constructor(conversationModel, messageModel, notificationModel, redisService) {
        this.conversationModel = conversationModel;
        this.messageModel = messageModel;
        this.notificationModel = notificationModel;
        this.redisService = redisService;
    }
    async getConversations(userId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const maxLimit = Math.min(limit, 50);
        const conversations = await this.conversationModel.find({
            participants: userId,
            deletedAt: null,
        })
            .populate({
            path: 'participants',
            select: 'fullName avatar',
            match: { deletedAt: null },
        })
            .populate({
            path: 'lastMessage',
            match: { deletedAt: null },
        })
            .select('participants lastMessage lastMessageAt createdAt')
            .sort({ lastMessageAt: -1 })
            .skip(skip)
            .limit(maxLimit)
            .lean();
        const conversationIds = conversations.map((conv) => conv._id.toString());
        const userIdStr = String(userId).trim();
        const unreadCountsResult = await this.messageModel.aggregate([
            {
                $match: {
                    conversationId: { $in: conversationIds },
                    read: false,
                    deletedAt: null,
                },
            },
            {
                $addFields: {
                    senderIdStr: { $toString: '$senderId' },
                },
            },
            {
                $match: {
                    senderIdStr: { $ne: userIdStr },
                },
            },
            {
                $group: {
                    _id: '$conversationId',
                    count: { $sum: 1 },
                },
            },
        ]);
        const unreadCountsMap = {};
        unreadCountsResult.forEach((item) => {
            unreadCountsMap[item._id] = item.count || 0;
        });
        const filteredConversations = conversations
            .map((conv) => {
            const validParticipants = (conv.participants || []).filter((p) => p !== null);
            if (validParticipants.length === 0) {
                return null;
            }
            const formattedParticipants = validParticipants.map((p) => ({
                id: p._id?.toString() || p.toString(),
                fullName: p.fullName || '',
                username: p.fullName || '',
                avatar: p.avatar || null,
            }));
            let formattedLastMessage = null;
            if (conv.lastMessage && conv.lastMessage !== null) {
                formattedLastMessage = {
                    id: conv.lastMessage._id?.toString() || conv.lastMessage.toString(),
                    text: conv.lastMessage.text || '',
                    createdAt: conv.lastMessage.createdAt || conv.lastMessageAt,
                };
            }
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
            .filter((conv) => conv !== null);
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
        const conversation = await this.conversationModel.findOne({
            _id: conversationId,
            deletedAt: null,
        }).lean();
        if (!conversation || !conversation.participants.includes(userId)) {
            throw new common_1.NotFoundException('Conversation not found');
        }
        const skip = (page - 1) * limit;
        const maxLimit = Math.min(limit, 50);
        const messages = await this.messageModel.find({
            conversationId,
            deletedAt: null,
        })
            .populate({
            path: 'senderId',
            select: 'fullName avatar',
            match: { deletedAt: null },
        })
            .select('senderId text read createdAt')
            .sort({ createdAt: 1 })
            .skip(skip)
            .limit(maxLimit)
            .lean();
        const validMessages = messages
            .filter((msg) => msg.senderId !== null)
            .map((msg) => {
            const sender = msg.senderId;
            return {
                id: msg._id.toString(),
                conversationId: msg.conversationId || conversationId,
                senderId: sender._id?.toString() || sender.toString(),
                receiverId: '',
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
    async sendMessage(senderId, receiverId, text) {
        let conversation = await this.conversationModel.findOne({
            participants: { $all: [senderId, receiverId] },
            deletedAt: null,
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
        await this.conversationModel.updateOne({ _id: conversation._id }, { lastMessage: message._id, lastMessageAt: new Date() });
        console.log('📬 Mesaj bildirimi oluşturuluyor:', {
            receiverId,
            fromUserId: senderId,
            conversationId: conversation._id.toString()
        });
        await this.notificationModel.create({
            userId: receiverId,
            fromUserId: senderId,
            type: 'message',
        });
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
        const populatedMessage = await message.populate('senderId', 'email fullName avatar');
        const msgObj = populatedMessage.toObject();
        const sender = msgObj.senderId;
        return {
            id: msgObj._id.toString(),
            conversationId: conversation._id.toString(),
            senderId: sender?._id?.toString() || sender?.toString() || senderId,
            receiverId: receiverId,
            text: msgObj.text || text,
            read: msgObj.read || false,
            createdAt: (msgObj.createdAt || new Date()),
            sender: {
                id: sender?._id?.toString() || sender?.toString() || senderId,
                fullName: sender?.fullName || '',
                username: sender?.fullName || '',
                avatar: sender?.avatar || null,
            },
        };
    }
    async markAsRead(conversationId, userId) {
        const userIdStr = String(userId).trim();
        const unreadMessages = await this.messageModel.find({
            conversationId,
            read: false,
            deletedAt: null,
        }).select('senderId').lean();
        const messagesToMark = unreadMessages.filter((msg) => {
            const senderIdStr = String(msg.senderId).trim();
            return senderIdStr !== userIdStr;
        });
        if (messagesToMark.length === 0) {
            return { modifiedCount: 0 };
        }
        const messageIds = messagesToMark.map((msg) => msg._id);
        const result = await this.messageModel.updateMany({
            _id: { $in: messageIds },
            read: false,
        }, { read: true });
        console.log('✅ Mesajlar okundu işaretlendi:', {
            conversationId,
            userId,
            modifiedCount: result.modifiedCount,
        });
        await this.redisService.del(`messages:unread:${userId}`);
        return { modifiedCount: result.modifiedCount };
    }
    async getUnreadMessagesCount(userId) {
        const cacheKey = `messages:unread:${userId}`;
        const cached = await this.redisService.get(cacheKey);
        if (cached !== null) {
            return parseInt(cached);
        }
        const userIdStr = String(userId).trim();
        const conversations = await this.conversationModel.find({
            participants: userIdStr,
            deletedAt: null,
        }).select('_id').lean();
        const conversationIds = conversations.map((c) => c._id.toString());
        if (conversationIds.length === 0) {
            await this.redisService.set(cacheKey, '0', 60);
            return 0;
        }
        const unreadMessages = await this.messageModel.find({
            conversationId: { $in: conversationIds },
            read: false,
            deletedAt: null,
        }).select('conversationId senderId').lean();
        const conversationsWithUnread = new Set();
        unreadMessages.forEach((msg) => {
            const senderIdStr = String(msg.senderId).trim();
            if (senderIdStr !== userIdStr) {
                conversationsWithUnread.add(String(msg.conversationId));
            }
        });
        const count = conversationsWithUnread.size;
        await this.redisService.set(cacheKey, count.toString(), 60);
        return count;
    }
};
exports.MessagesService = MessagesService;
exports.MessagesService = MessagesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(conversation_entity_1.Conversation.name)),
    __param(1, (0, mongoose_1.InjectModel)(message_entity_1.Message.name)),
    __param(2, (0, mongoose_1.InjectModel)(notification_entity_1.Notification.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        redis_service_1.RedisService])
], MessagesService);
//# sourceMappingURL=messages.service.js.map