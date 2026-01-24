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
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const notification_entity_1 = require("../entities/notification.entity");
const redis_service_1 = require("../common/redis/redis.service");
let NotificationsService = class NotificationsService {
    notificationModel;
    redisService;
    constructor(notificationModel, redisService) {
        this.notificationModel = notificationModel;
        this.redisService = redisService;
    }
    async getUserNotifications(userId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const maxLimit = Math.min(limit, 50);
        const notifications = await this.notificationModel.find({
            userId,
            deletedAt: null,
        })
            .populate('fromUserId', 'fullName avatar')
            .select('fromUserId postId type read createdAt postOwnerName isFollowerNotification')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(maxLimit)
            .lean();
        return {
            notifications: notifications.map((notification) => {
                const fromUserIdObj = notification.fromUserId;
                let fromUserData;
                if (typeof fromUserIdObj === 'object' && fromUserIdObj?._id) {
                    fromUserData = {
                        _id: fromUserIdObj._id,
                        fullName: fromUserIdObj.fullName || '',
                        avatar: fromUserIdObj.avatar || null,
                    };
                }
                else {
                    fromUserData = {
                        _id: fromUserIdObj || notification.fromUserId,
                        fullName: '',
                        avatar: null,
                    };
                }
                return {
                    id: notification._id.toString(),
                    type: notification.type,
                    fromUser: {
                        id: fromUserData._id.toString(),
                        username: fromUserData.fullName || '',
                        fullName: fromUserData.fullName || '',
                        avatar: fromUserData.avatar || null,
                    },
                    postId: notification.postId ? notification.postId.toString() : null,
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
        const notification = await this.notificationModel.findOne({
            _id: notificationId,
            userId,
            deletedAt: null,
            read: false,
        });
        if (notification) {
            await this.notificationModel.updateOne({ _id: notificationId, userId, deletedAt: null }, { read: true });
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
        await this.notificationModel.updateMany({ userId, read: false, deletedAt: null }, { read: true });
        await this.redisService.set(`notification:unread:${userId}`, '0', 60);
    }
    async getUnreadCount(userId) {
        const cacheKey = `notification:unread:${userId}`;
        const cached = await this.redisService.get(cacheKey);
        if (cached !== null) {
            return parseInt(cached);
        }
        const count = await this.notificationModel.countDocuments({
            userId,
            read: false,
            deletedAt: null,
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
    __param(0, (0, mongoose_1.InjectModel)(notification_entity_1.Notification.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        redis_service_1.RedisService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map