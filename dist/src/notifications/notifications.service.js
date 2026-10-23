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
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const notification_entity_1 = require("../entities/notification.entity");
const user_entity_1 = require("../entities/user.entity");
const redis_service_1 = require("../common/redis/redis.service");
let NotificationsService = class NotificationsService {
    notificationRepository;
    userRepository;
    redisService;
    constructor(notificationRepository, userRepository, redisService) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.redisService = redisService;
    }
    async getUserNotifications(userId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const maxLimit = Math.min(limit, 50);
        const notifications = await this.notificationRepository.find({
            where: { userId, deletedAt: (0, typeorm_2.IsNull)() },
            order: { createdAt: 'DESC' },
            skip,
            take: maxLimit,
        });
        const fromUserIds = Array.from(new Set(notifications.map((n) => n.fromUserId).filter(Boolean)));
        let fromUserMap = new Map();
        if (fromUserIds.length > 0) {
            const users = await this.userRepository.find({
                where: { id: (0, typeorm_2.In)(fromUserIds) },
                select: ['id', 'fullName', 'avatar'],
            });
            fromUserMap = new Map(users.map((u) => [u.id, u]));
        }
        return {
            notifications: notifications.map((notification) => {
                const fromUser = fromUserMap.get(notification.fromUserId);
                return {
                    id: notification.id,
                    _id: notification.id,
                    type: notification.type,
                    fromUser: {
                        id: notification.fromUserId,
                        _id: notification.fromUserId,
                        username: fromUser?.fullName || '',
                        fullName: fromUser?.fullName || '',
                        avatar: fromUser?.avatar || null,
                    },
                    postId: notification.postId || null,
                    postOwnerName: notification.postOwnerName || null,
                    isFollowerNotification: notification.isFollowerNotification || false,
                    read: notification.read || false,
                    createdAt: notification.createdAt,
                };
            }),
            pagination: {
                page,
                limit: maxLimit,
                hasMore: notifications.length === maxLimit,
            },
        };
    }
    async markAsRead(notificationId, userId) {
        const notification = await this.notificationRepository.findOne({
            where: { id: notificationId, userId, deletedAt: (0, typeorm_2.IsNull)(), read: false },
        });
        if (notification) {
            notification.read = true;
            await this.notificationRepository.save(notification);
            const cacheKey = `notification:unread:${userId}`;
            const cached = await this.redisService.get(cacheKey);
            if (cached !== null) {
                const currentCount = parseInt(cached);
                if (currentCount > 0) {
                    await this.redisService.set(cacheKey, (currentCount - 1).toString(), 60);
                }
                else {
                    await this.redisService.del(cacheKey);
                }
            }
        }
    }
    async markAllAsRead(userId) {
        await this.notificationRepository.update({ userId, read: false, deletedAt: (0, typeorm_2.IsNull)() }, { read: true });
        await this.redisService.set(`notification:unread:${userId}`, '0', 60);
    }
    async getUnreadCount(userId) {
        const cacheKey = `notification:unread:${userId}`;
        const cached = await this.redisService.get(cacheKey);
        if (cached !== null) {
            return parseInt(cached);
        }
        const count = await this.notificationRepository.count({
            where: { userId, read: false, deletedAt: (0, typeorm_2.IsNull)() },
        });
        await this.redisService.set(cacheKey, count.toString(), 60);
        return count;
    }
    async incrementUnreadCount(userId) {
        const cacheKey = `notification:unread:${userId}`;
        const cached = await this.redisService.get(cacheKey);
        if (cached !== null) {
            await this.redisService.incr(cacheKey);
            await this.redisService.expire(cacheKey, 60);
        }
        else {
            await this.redisService.set(cacheKey, '1', 60);
        }
    }
    async invalidateUnreadCount(userId) {
        await this.redisService.del(`notification:unread:${userId}`);
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(notification_entity_1.Notification)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        redis_service_1.RedisService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map