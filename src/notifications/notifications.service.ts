import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification } from '../entities/notification.entity';
import { RedisService } from '../common/redis/redis.service';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<Notification>,
    private readonly redisService: RedisService,
  ) {}

  async getUserNotifications(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const maxLimit = Math.min(limit, 50);
    
    const notifications = await this.notificationModel.find({ 
      userId,
      deletedAt: null, // Soft delete kontrolü
    })
      .populate('fromUserId', 'fullName avatar')
      // postId'yi populate etme, direkt string olarak kullan
      .select('fromUserId postId type read createdAt postOwnerName isFollowerNotification')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(maxLimit)
      .lean();
    
    return {
      notifications: notifications.map((notification: any) => {
        const fromUserIdObj = notification.fromUserId;
        let fromUserData;
        
        if (typeof fromUserIdObj === 'object' && fromUserIdObj?._id) {
          fromUserData = {
            _id: fromUserIdObj._id,
            fullName: fromUserIdObj.fullName || '',
            avatar: fromUserIdObj.avatar || null,
          };
        } else {
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

  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.notificationModel.findOne({
      _id: notificationId,
      userId,
      deletedAt: null,
      read: false, // Only update if not already read
    });

    if (notification) {
      await this.notificationModel.updateOne(
        { _id: notificationId, userId, deletedAt: null },
        { read: true }
      );

      // Decrement cache count
      const cacheKey = `notification:unread:${userId}`;
      const cached = await this.redisService.get(cacheKey);
      if (cached !== null) {
        const currentCount = parseInt(cached);
        if (currentCount > 0) {
          await this.redisService.set(cacheKey, (currentCount - 1).toString(), 60);
        } else {
          await this.redisService.del(cacheKey);
        }
      }
    }
  }

  async markAllAsRead(userId: string) {
    await this.notificationModel.updateMany(
      { userId, read: false, deletedAt: null },
      { read: true }
    );

    // Clear cache count
    await this.redisService.set(`notification:unread:${userId}`, '0', 60);
  }

  async getUnreadCount(userId: string): Promise<number> {
    const cacheKey = `notification:unread:${userId}`;

    // Try to get from cache first
    const cached = await this.redisService.get(cacheKey);
    if (cached !== null) {
      return parseInt(cached);
    }

    // Calculate from MongoDB
    const count = await this.notificationModel.countDocuments({
      userId,
      read: false,
      deletedAt: null, // Soft delete kontrolü
    });

    // Cache the result (TTL: 1 minute = 60 seconds)
    await this.redisService.set(cacheKey, count.toString(), 60);

    return count;
  }

  // Method to increment unread count when a new notification is created
  async incrementUnreadCount(userId: string): Promise<void> {
    const cacheKey = `notification:unread:${userId}`;
    const cached = await this.redisService.get(cacheKey);
    
    if (cached !== null) {
      // Increment existing count
      await this.redisService.incr(cacheKey);
      await this.redisService.expire(cacheKey, 60);
    } else {
      // Initialize with 1
      await this.redisService.set(cacheKey, '1', 60);
    }
  }

  // Method to invalidate unread count cache
  async invalidateUnreadCount(userId: string): Promise<void> {
    await this.redisService.del(`notification:unread:${userId}`);
  }
}

