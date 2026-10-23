import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { User } from '../entities/user.entity';
import { RedisService } from '../common/redis/redis.service';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private notificationRepository: Repository<Notification>,
    @InjectRepository(User) private userRepository: Repository<User>,
    private readonly redisService: RedisService,
  ) {}

  async getUserNotifications(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const maxLimit = Math.min(limit, 50);

    const notifications = await this.notificationRepository.find({
      where: { userId, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
      skip,
      take: maxLimit,
    });

    const fromUserIds = Array.from(new Set(notifications.map((n) => n.fromUserId).filter(Boolean)));
    let fromUserMap = new Map<string, User>();
    if (fromUserIds.length > 0) {
      const users = await this.userRepository.find({
        where: { id: In(fromUserIds) },
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

  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId, deletedAt: IsNull(), read: false },
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
        } else {
          await this.redisService.del(cacheKey);
        }
      }
    }
  }

  async markAllAsRead(userId: string) {
    await this.notificationRepository.update(
      { userId, read: false, deletedAt: IsNull() },
      { read: true },
    );

    await this.redisService.set(`notification:unread:${userId}`, '0', 60);
  }

  async getUnreadCount(userId: string): Promise<number> {
    const cacheKey = `notification:unread:${userId}`;

    const cached = await this.redisService.get(cacheKey);
    if (cached !== null) {
      return parseInt(cached);
    }

    const count = await this.notificationRepository.count({
      where: { userId, read: false, deletedAt: IsNull() },
    });

    await this.redisService.set(cacheKey, count.toString(), 60);
    return count;
  }

  async incrementUnreadCount(userId: string): Promise<void> {
    const cacheKey = `notification:unread:${userId}`;
    const cached = await this.redisService.get(cacheKey);

    if (cached !== null) {
      await this.redisService.incr(cacheKey);
      await this.redisService.expire(cacheKey, 60);
    } else {
      await this.redisService.set(cacheKey, '1', 60);
    }
  }

  async invalidateUnreadCount(userId: string): Promise<void> {
    await this.redisService.del(`notification:unread:${userId}`);
  }
}
