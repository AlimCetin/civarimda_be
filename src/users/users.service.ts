import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull, ILike } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserCredentials } from '../entities/user-credentials.entity';
import { Post } from '../entities/post.entity';
import { Comment } from '../entities/comment.entity';
import { Conversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';
import { Notification } from '../entities/notification.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RedisService } from '../common/redis/redis.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(UserCredentials) private credentialsRepository: Repository<UserCredentials>,
    @InjectRepository(Post) private postRepository: Repository<Post>,
    @InjectRepository(Comment) private commentRepository: Repository<Comment>,
    @InjectRepository(Conversation) private conversationRepository: Repository<Conversation>,
    @InjectRepository(Message) private messageRepository: Repository<Message>,
    @InjectRepository(Notification) private notificationRepository: Repository<Notification>,
    private readonly redisService: RedisService,
  ) {}

  async findById(userId: string, currentUserId?: string) {
    const cacheKey = `user:${userId}`;

    if (!currentUserId || currentUserId === userId) {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    const user = await this.userRepository.findOne({
      where: { id: userId, deletedAt: IsNull() },
    });
    if (!user) throw new NotFoundException('User not found');

    if (currentUserId && user.blockedUsers?.includes(currentUserId)) {
      throw new ForbiddenException('You are blocked by this user');
    }

    const userObj = user.toObject ? user.toObject() : { ...user };
    const followerCount = userObj.followers?.length || 0;
    const followingCount = userObj.following?.length || 0;

    let result;
    if (currentUserId && currentUserId !== userId) {
      const currentUser = await this.userRepository.findOne({
        where: { id: currentUserId, deletedAt: IsNull() },
      });
      const isFollowing = currentUser?.following?.includes(userId) || false;

      result = {
        ...userObj,
        id: userObj.id,
        _id: userObj.id,
        isFollowing,
        followerCount,
        followingCount,
      };
    } else {
      result = {
        ...userObj,
        id: userObj.id,
        _id: userObj.id,
        followerCount,
        followingCount,
      };

      await this.redisService.set(cacheKey, JSON.stringify(result), 1800);
    }

    return result;
  }

  async search(query: string) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const normalizedQuery = query.trim().toLowerCase();
    const cacheKey = `search:users:${normalizedQuery}`;

    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const users = await this.userRepository
        .createQueryBuilder('user')
        .where('user.deletedAt IS NULL')
        .andWhere('user.fullName ILIKE :q', { q: `%${query.trim()}%` })
        .select(['user.id', 'user.fullName', 'user.avatar', 'user.bio'])
        .limit(20)
        .getMany();

      const result = users.map((user) => ({
        ...user,
        id: user.id,
        _id: user.id,
        username: user.fullName,
      }));

      await this.redisService.set(cacheKey, JSON.stringify(result), 300);
      return result;
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  async follow(userId: string, currentUserId: string) {
    if (userId === currentUserId) {
      throw new BadRequestException('Cannot follow yourself');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId, deletedAt: IsNull() },
    });
    if (!user) throw new NotFoundException('User not found');

    const currentUser = await this.userRepository.findOne({
      where: { id: currentUserId, deletedAt: IsNull() },
    });
    if (!currentUser) throw new NotFoundException('Current user not found');

    if (user.blockedUsers?.includes(currentUserId)) {
      throw new ForbiddenException('You are blocked by this user');
    }

    if (currentUser.blockedUsers?.includes(userId)) {
      throw new ForbiddenException('You have blocked this user');
    }

    if (currentUser.following?.includes(userId)) {
      throw new BadRequestException('Already following');
    }

    currentUser.following = [...(currentUser.following || []), userId];
    user.followers = [...(user.followers || []), currentUserId];

    await this.userRepository.save(currentUser);
    await this.userRepository.save(user);

    await this.invalidateFeedCache(currentUserId);
    return { message: 'Followed successfully' };
  }

  async unfollow(userId: string, currentUserId: string) {
    const currentUser = await this.userRepository.findOne({
      where: { id: currentUserId, deletedAt: IsNull() },
    });
    const user = await this.userRepository.findOne({
      where: { id: userId, deletedAt: IsNull() },
    });

    if (currentUser) {
      currentUser.following = (currentUser.following || []).filter((id) => id !== userId);
      await this.userRepository.save(currentUser);
    }

    if (user) {
      user.followers = (user.followers || []).filter((id) => id !== currentUserId);
      await this.userRepository.save(user);
    }

    await this.invalidateFeedCache(currentUserId);
    return { message: 'Unfollowed successfully' };
  }

  async block(userId: string, currentUserId: string) {
    if (userId === currentUserId) {
      throw new BadRequestException('Cannot block yourself');
    }

    const currentUser = await this.userRepository.findOne({
      where: { id: currentUserId, deletedAt: IsNull() },
    });
    if (currentUser) {
      if (!currentUser.blockedUsers?.includes(userId)) {
        currentUser.blockedUsers = [...(currentUser.blockedUsers || []), userId];
        await this.userRepository.save(currentUser);
      }
    }

    await this.unfollow(userId, currentUserId);
    await this.unfollow(currentUserId, userId);
    return { message: 'Blocked successfully' };
  }

  async unblock(userId: string, currentUserId: string) {
    const currentUser = await this.userRepository.findOne({
      where: { id: currentUserId, deletedAt: IsNull() },
    });
    if (currentUser) {
      currentUser.blockedUsers = (currentUser.blockedUsers || []).filter((id) => id !== userId);
      await this.userRepository.save(currentUser);
    }
    return { message: 'Unblocked successfully' };
  }

  async updateProfile(userId: string, data: UpdateProfileDto) {
    await this.userRepository.update({ id: userId, deletedAt: IsNull() }, data as any);

    const updatedUser = await this.userRepository.findOne({
      where: { id: userId, deletedAt: IsNull() },
    });
    if (!updatedUser) throw new NotFoundException('User not found');

    const userObj = updatedUser.toObject ? updatedUser.toObject() : { ...updatedUser };
    const result = {
      ...userObj,
      id: userObj.id,
      _id: userObj.id,
      followerCount: userObj.followers?.length || 0,
      followingCount: userObj.following?.length || 0,
    };

    await this.redisService.del(`user:${userId}`);
    return result;
  }

  async getBlockedUsers(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId, deletedAt: IsNull() },
    });
    if (!user) throw new NotFoundException('User not found');

    const blockedIds = user.blockedUsers || [];
    if (blockedIds.length === 0) return [];

    return this.userRepository.find({
      where: { id: In(blockedIds), deletedAt: IsNull() },
      select: ['id', 'fullName', 'avatar'],
    });
  }

  async getFollowers(userId: string, currentUserId?: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId, deletedAt: IsNull() },
    });
    if (!user) throw new NotFoundException('User not found');

    if (currentUserId && user.blockedUsers?.includes(currentUserId)) {
      throw new ForbiddenException('You are blocked by this user');
    }

    const isOwnProfile = currentUserId && currentUserId === userId;
    if (!isOwnProfile && user.hideFollowers) {
      throw new ForbiddenException('Followers list is hidden');
    }

    const followerIds = user.followers || [];
    if (followerIds.length === 0) return [];

    let visibleFollowerIds = followerIds;
    if (!isOwnProfile && user.hiddenFollowers && user.hiddenFollowers.length > 0) {
      visibleFollowerIds = followerIds.filter((id) => !user.hiddenFollowers.includes(id));
    }

    if (visibleFollowerIds.length === 0) return [];

    const followers = await this.userRepository.find({
      where: { id: In(visibleFollowerIds), deletedAt: IsNull() },
      select: ['id', 'fullName', 'avatar'],
    });

    let currentUserFollowing: string[] = [];
    if (currentUserId) {
      const currentUser = await this.userRepository.findOne({
        where: { id: currentUserId, deletedAt: IsNull() },
      });
      currentUserFollowing = currentUser?.following || [];
    }

    return followers.map((follower) => ({
      id: follower.id,
      _id: follower.id,
      fullName: follower.fullName,
      avatar: follower.avatar,
      isFollowing: currentUserFollowing.includes(follower.id),
    }));
  }

  async getFollowing(userId: string, currentUserId?: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId, deletedAt: IsNull() },
    });
    if (!user) throw new NotFoundException('User not found');

    if (currentUserId && user.blockedUsers?.includes(currentUserId)) {
      throw new ForbiddenException('You are blocked by this user');
    }

    const isOwnProfile = currentUserId && currentUserId === userId;
    if (!isOwnProfile && user.hideFollowing) {
      throw new ForbiddenException('Following list is hidden');
    }

    const followingIds = user.following || [];
    if (followingIds.length === 0) return [];

    let visibleFollowingIds = followingIds;
    if (!isOwnProfile && user.hiddenFollowing && user.hiddenFollowing.length > 0) {
      visibleFollowingIds = followingIds.filter((id) => !user.hiddenFollowing.includes(id));
    }

    if (visibleFollowingIds.length === 0) return [];

    const following = await this.userRepository.find({
      where: { id: In(visibleFollowingIds), deletedAt: IsNull() },
      select: ['id', 'fullName', 'avatar'],
    });

    let currentUserFollowing: string[] = [];
    if (currentUserId) {
      const currentUser = await this.userRepository.findOne({
        where: { id: currentUserId, deletedAt: IsNull() },
      });
      currentUserFollowing = currentUser?.following || [];
    }

    return following.map((followed) => ({
      id: followed.id,
      _id: followed.id,
      fullName: followed.fullName,
      avatar: followed.avatar,
      isFollowing: currentUserFollowing.includes(followed.id),
    }));
  }

  async deleteAccount(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId, deletedAt: IsNull() },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const deletedAt = new Date();

    const userPosts = await this.postRepository.find({
      where: { userId, deletedAt: IsNull() },
      select: ['id'],
    });
    const postIds = userPosts.map((p) => p.id);

    if (postIds.length > 0) {
      await this.commentRepository
        .createQueryBuilder()
        .update(Comment)
        .set({ deletedAt })
        .where('postId IN (:...postIds)', { postIds })
        .andWhere('deletedAt IS NULL')
        .execute();

      await this.notificationRepository
        .createQueryBuilder()
        .update(Notification)
        .set({ deletedAt })
        .where('postId IN (:...postIds)', { postIds })
        .andWhere('deletedAt IS NULL')
        .execute();

      await this.postRepository
        .createQueryBuilder()
        .update(Post)
        .set({ deletedAt })
        .where('userId = :userId', { userId })
        .andWhere('deletedAt IS NULL')
        .execute();
    }

    await this.commentRepository
      .createQueryBuilder()
      .update(Comment)
      .set({ deletedAt })
      .where('userId = :userId', { userId })
      .andWhere('deletedAt IS NULL')
      .execute();

    const userConversations = await this.conversationRepository
      .createQueryBuilder('c')
      .where(':userId = ANY(c.participants)', { userId })
      .andWhere('c.deletedAt IS NULL')
      .getMany();

    for (const conv of userConversations) {
      await this.messageRepository
        .createQueryBuilder()
        .update(Message)
        .set({ deletedAt })
        .where('conversationId = :convId', { convId: conv.id })
        .andWhere('deletedAt IS NULL')
        .execute();

      const otherParticipants = conv.participants.filter((p) => p !== userId);
      if (otherParticipants.length === 0) {
        conv.deletedAt = deletedAt;
      } else {
        conv.participants = otherParticipants;
      }
      await this.conversationRepository.save(conv);
    }

    await this.notificationRepository
      .createQueryBuilder()
      .update(Notification)
      .set({ deletedAt })
      .where('(userId = :userId OR fromUserId = :userId)', { userId })
      .andWhere('deletedAt IS NULL')
      .execute();

    await this.credentialsRepository.delete({ userId });

    user.deletedAt = deletedAt;
    await this.userRepository.save(user);

    await this.invalidateFeedCache(userId);
    await this.redisService.del(`user:${userId}`);

    return { message: 'Account deleted successfully' };
  }

  private async invalidateFeedCache(userId: string): Promise<void> {
    try {
      const keys = await this.redisService.keys(`feed:${userId}:*`);
      if (keys.length > 0) {
        await this.redisService.mdel(keys);
      }
    } catch (error) {
      console.error('Error invalidating feed cache:', error);
    }
  }
}
