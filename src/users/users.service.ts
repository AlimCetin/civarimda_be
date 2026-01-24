import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(UserCredentials.name) private credentialsModel: Model<UserCredentials>,
    @InjectModel(Post.name) private postModel: Model<Post>,
    @InjectModel(Comment.name) private commentModel: Model<Comment>,
    @InjectModel(Conversation.name) private conversationModel: Model<Conversation>,
    @InjectModel(Message.name) private messageModel: Model<Message>,
    @InjectModel(Notification.name) private notificationModel: Model<Notification>,
    private readonly redisService: RedisService,
  ) {}

  async findById(userId: string, currentUserId?: string) {
    // Cache key: user:userId
    const cacheKey = `user:${userId}`;

    // Try to get from cache first (only if not viewing as another user, to avoid cache complexity)
    if (!currentUserId || currentUserId === userId) {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        const cachedUser = JSON.parse(cached);
        // If viewing own profile, return cached data
        if (!currentUserId || currentUserId === userId) {
          return cachedUser;
        }
      }
    }

    const user = await this.userModel.findOne({ _id: userId, deletedAt: null });
    if (!user) throw new NotFoundException('User not found');
    
    // Check if current user is blocked by this user
    if (currentUserId && user.blockedUsers?.some((id: any) => id.toString() === currentUserId)) {
      throw new ForbiddenException('You are blocked by this user');
    }
    
    // Convert to plain object
    const userObj = user.toObject();
    
    // Get follower and following counts
    const followerCount = userObj.followers?.length || 0;
    const followingCount = userObj.following?.length || 0;
    
    let result;
    if (currentUserId && currentUserId !== userId) {
      // Check if current user is following this user
      const currentUser = await this.userModel.findOne({ _id: currentUserId, deletedAt: null }).select('following');
      const isFollowing = currentUser?.following?.some(
        (id: any) => id.toString() === userId
      ) || false;
      
      result = {
        ...userObj,
        id: userObj._id.toString(),
        isFollowing,
        followerCount,
        followingCount,
      };
    } else {
      result = {
        ...userObj,
        id: userObj._id.toString(),
        followerCount,
        followingCount,
      };

      // Cache the result (TTL: 30 minutes = 1800 seconds) - only cache own profile view
      await this.redisService.set(cacheKey, JSON.stringify(result), 1800);
    }
    
    return result;
  }

  async search(query: string) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    // Normalize query for cache key
    const normalizedQuery = query.trim().toLowerCase();
    const cacheKey = `search:users:${normalizedQuery}`;

    // Try to get from cache first
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Sanitize input to prevent regex injection
    const sanitizedQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    console.log('🔍 Arama yapılıyor:', sanitizedQuery);

    try {
      // Username veya fullName ile arama yap (case-insensitive)
      const users = await this.userModel
        .find({
          deletedAt: null, // Soft delete kontrolü
          $or: [
            { username: { $regex: sanitizedQuery, $options: 'i' } },
            { fullName: { $regex: sanitizedQuery, $options: 'i' } },
          ],
        })
        .select('_id username fullName avatar bio')
        .limit(20)
        .lean();

      console.log('✅ Bulunan kullanıcı sayısı:', users.length);

      // ID'leri string'e çevir ve format dönüştür
      const result = users.map(user => ({
        ...user,
        id: user._id.toString(),
      }));

      // Cache the result (TTL: 5 minutes = 300 seconds)
      await this.redisService.set(cacheKey, JSON.stringify(result), 300);

      return result;
    } catch (error) {
      console.error('❌ Arama hatası:', error);
      return [];
    }
  }

  async follow(userId: string, currentUserId: string) {
    if (userId === currentUserId) {
      throw new BadRequestException('Cannot follow yourself');
    }
    
    // Get users directly (don't use findById to avoid recursion)
    const user = await this.userModel.findOne({ _id: userId, deletedAt: null });
    if (!user) throw new NotFoundException('User not found');
    
    const currentUser = await this.userModel.findOne({ _id: currentUserId, deletedAt: null });
    if (!currentUser) throw new NotFoundException('Current user not found');

    // Check if current user is blocked by target user
    const blockedByTarget = user.blockedUsers?.some(
      (id: any) => id.toString() === currentUserId
    );
    if (blockedByTarget) {
      throw new ForbiddenException('You are blocked by this user');
    }

    // Check if current user has blocked target user
    const hasBlockedTarget = currentUser.blockedUsers?.some(
      (id: any) => id.toString() === userId
    );
    if (hasBlockedTarget) {
      throw new ForbiddenException('You have blocked this user');
    }

    // Check if already following (convert to string for comparison)
    const isAlreadyFollowing = currentUser.following?.some(
      (id: any) => id.toString() === userId
    );
    if (isAlreadyFollowing) {
      throw new BadRequestException('Already following');
    }

    await this.userModel.updateOne(
      { _id: currentUserId },
      { $addToSet: { following: userId } }
    );
    await this.userModel.updateOne(
      { _id: userId },
      { $addToSet: { followers: currentUserId } }
    );

    // Invalidate feed cache for the current user (their feed will change)
    await this.invalidateFeedCache(currentUserId);

    return { message: 'Followed successfully' };
  }

  async unfollow(userId: string, currentUserId: string) {
    await this.userModel.updateOne(
      { _id: currentUserId },
      { $pull: { following: userId } }
    );
    await this.userModel.updateOne(
      { _id: userId },
      { $pull: { followers: currentUserId } }
    );

    // Invalidate feed cache for the current user (their feed will change)
    await this.invalidateFeedCache(currentUserId);

    return { message: 'Unfollowed successfully' };
  }

  async block(userId: string, currentUserId: string) {
    if (userId === currentUserId) {
      throw new BadRequestException('Cannot block yourself');
    }
    
    await this.userModel.updateOne(
      { _id: currentUserId },
      { $addToSet: { blockedUsers: userId } }
    );
    await this.unfollow(userId, currentUserId);
    await this.unfollow(currentUserId, userId);
    return { message: 'Blocked successfully' };
  }

  async unblock(userId: string, currentUserId: string) {
    await this.userModel.updateOne(
      { _id: currentUserId },
      { $pull: { blockedUsers: userId } }
    );
    return { message: 'Unblocked successfully' };
  }

  async updateProfile(userId: string, data: UpdateProfileDto) {
    const updatedUser = await this.userModel.findOneAndUpdate(
      { _id: userId, deletedAt: null },
      data,
      { new: true }
    );
    if (!updatedUser) throw new NotFoundException('User not found');
    
    const userObj = updatedUser.toObject();
    const result = {
      ...userObj,
      id: userObj._id.toString(),
      followerCount: userObj.followers?.length || 0,
      followingCount: userObj.following?.length || 0,
    };

    // Invalidate user profile cache
    await this.redisService.del(`user:${userId}`);

    return result;
  }

  async getBlockedUsers(userId: string) {
    const user = await this.userModel.findOne({ _id: userId, deletedAt: null }).populate('blockedUsers');
    if (!user) throw new NotFoundException('User not found');
    return user.blockedUsers;
  }

  async getFollowers(userId: string, currentUserId?: string) {
    const user = await this.userModel.findOne({ _id: userId, deletedAt: null });
    if (!user) throw new NotFoundException('User not found');
    
    // Check if current user is blocked by this user
    if (currentUserId && user.blockedUsers?.some((id: any) => id.toString() === currentUserId)) {
      throw new ForbiddenException('You are blocked by this user');
    }
    
    // Check if followers are hidden
    const isOwnProfile = currentUserId && currentUserId === userId;
    if (!isOwnProfile && user.hideFollowers) {
      throw new ForbiddenException('Followers list is hidden');
    }
    
    const followerIds = user.followers || [];
    if (followerIds.length === 0) return [];
    
    // Filter out hidden followers if not own profile
    let visibleFollowerIds = followerIds;
    if (!isOwnProfile && user.hiddenFollowers && user.hiddenFollowers.length > 0) {
      const hiddenIds = user.hiddenFollowers.map((id: any) => id.toString());
      visibleFollowerIds = followerIds.filter((id: any) => !hiddenIds.includes(id.toString()));
    }
    
    if (visibleFollowerIds.length === 0) return [];
    
    // Get follower users
    const followers = await this.userModel.find({
      _id: { $in: visibleFollowerIds },
      deletedAt: null, // Soft delete kontrolü
    }).select('fullName avatar _id');
    
    // Get current user's following list to check isFollowing
    let currentUserFollowing: string[] = [];
    if (currentUserId) {
      const currentUser = await this.userModel.findOne({ _id: currentUserId, deletedAt: null }).select('following');
      currentUserFollowing = currentUser?.following?.map((id: any) => id.toString()) || [];
    }
    
    // Format response
    return followers.map((follower: any) => {
      const followerId = follower._id.toString();
      return {
        id: followerId,
        fullName: follower.fullName,
        avatar: follower.avatar,
        isFollowing: currentUserFollowing.includes(followerId),
      };
    });
  }

  async getFollowing(userId: string, currentUserId?: string) {
    const user = await this.userModel.findOne({ _id: userId, deletedAt: null });
    if (!user) throw new NotFoundException('User not found');
    
    // Check if current user is blocked by this user
    if (currentUserId && user.blockedUsers?.some((id: any) => id.toString() === currentUserId)) {
      throw new ForbiddenException('You are blocked by this user');
    }
    
    // Check if following are hidden
    const isOwnProfile = currentUserId && currentUserId === userId;
    if (!isOwnProfile && user.hideFollowing) {
      throw new ForbiddenException('Following list is hidden');
    }
    
    const followingIds = user.following || [];
    if (followingIds.length === 0) return [];
    
    // Filter out hidden following if not own profile
    let visibleFollowingIds = followingIds;
    if (!isOwnProfile && user.hiddenFollowing && user.hiddenFollowing.length > 0) {
      const hiddenIds = user.hiddenFollowing.map((id: any) => id.toString());
      visibleFollowingIds = followingIds.filter((id: any) => !hiddenIds.includes(id.toString()));
    }
    
    if (visibleFollowingIds.length === 0) return [];
    
    // Get following users
    const following = await this.userModel.find({
      _id: { $in: visibleFollowingIds },
      deletedAt: null, // Soft delete kontrolü
    }).select('fullName avatar _id');
    
    // Get current user's following list to check isFollowing
    let currentUserFollowing: string[] = [];
    if (currentUserId) {
      const currentUser = await this.userModel.findOne({ _id: currentUserId, deletedAt: null }).select('following');
      currentUserFollowing = currentUser?.following?.map((id: any) => id.toString()) || [];
    }
    
    // Format response
    return following.map((followed: any) => {
      const followedId = followed._id.toString();
      return {
        id: followedId,
        fullName: followed.fullName,
        avatar: followed.avatar,
        isFollowing: currentUserFollowing.includes(followedId),
      };
    });
  }

  async deleteAccount(userId: string) {
    console.log('🗑️ Kullanıcı hesabı siliniyor (soft delete):', userId);

    // Kullanıcının var olup olmadığını kontrol et
    const user = await this.userModel.findOne({ _id: userId, deletedAt: null });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const deletedAt = new Date();

    // 1. Tüm postları soft delete yap ve ilişkili verileri temizle
    const userPosts = await this.postModel.find({ userId, deletedAt: null }).select('_id');
    const postIds = userPosts.map(p => p._id.toString());
    
    if (postIds.length > 0) {
      // Post'lara ait yorumları soft delete yap
      await this.commentModel.updateMany(
        { postId: { $in: postIds }, deletedAt: null },
        { $set: { deletedAt } }
      );
      
      // Post'lara ait bildirimleri soft delete yap
      await this.notificationModel.updateMany(
        { postId: { $in: postIds }, deletedAt: null },
        { $set: { deletedAt } }
      );
      
      // Tüm kullanıcıların savedPosts'larından bu postları kaldır
      await this.userModel.updateMany(
        { savedPosts: { $in: postIds } },
        { $pull: { savedPosts: { $in: postIds } } }
      );
      
      // Post'ları soft delete yap
      await this.postModel.updateMany(
        { userId, deletedAt: null },
        { $set: { deletedAt } }
      );
      console.log(`  ✅ ${postIds.length} post soft delete yapıldı`);
    }

    // 2. Kullanıcının yazdığı yorumları soft delete yap
    const deletedComments = await this.commentModel.updateMany(
      { userId, deletedAt: null },
      { $set: { deletedAt } }
    );
    console.log(`  ✅ ${deletedComments.modifiedCount} yorum soft delete yapıldı`);

    // 3. Mesajları ve conversation'ları temizle
    const userConversations = await this.conversationModel.find({
      participants: userId,
      deletedAt: null,
    });
    
    for (const conv of userConversations) {
      // Conversation'daki mesajları soft delete yap
      await this.messageModel.updateMany(
        { conversationId: conv._id.toString(), deletedAt: null },
        { $set: { deletedAt } }
      );
      
      // Eğer conversation'da sadece bu kullanıcı varsa conversation'ı soft delete yap
      // Değilse, participants'tan bu kullanıcıyı çıkar
      const otherParticipants = conv.participants.filter(
        (p: any) => p.toString() !== userId
      );
      
      if (otherParticipants.length === 0) {
        await this.conversationModel.updateOne(
          { _id: conv._id },
          { $set: { deletedAt } }
        );
      } else {
        await this.conversationModel.updateOne(
          { _id: conv._id },
          { $pull: { participants: userId } }
        );
      }
    }
    console.log(`  ✅ ${userConversations.length} conversation temizlendi`);

    // 4. Bildirimleri soft delete yap (kullanıcıya gelen ve kullanıcıdan giden)
    const deletedNotifications = await this.notificationModel.updateMany(
      {
        $or: [
          { userId, deletedAt: null },
          { fromUserId: userId, deletedAt: null },
        ],
      },
      { $set: { deletedAt } }
    );
    console.log(`  ✅ ${deletedNotifications.modifiedCount} bildirim soft delete yapıldı`);

    // 5. Follow ilişkilerini temizle
    // Kullanıcıyı takip edenlerin following listesinden çıkar
    await this.userModel.updateMany(
      { following: userId, deletedAt: null },
      { $pull: { following: userId } }
    );
    
    // Kullanıcının takip ettiği kişilerin followers listesinden çıkar
    await this.userModel.updateMany(
      { followers: userId, deletedAt: null },
      { $pull: { followers: userId } }
    );
    console.log('  ✅ Follow ilişkileri temizlendi');

    // 6. Block ilişkilerini temizle
    // Kullanıcıyı engelleyenlerin blockedUsers listesinden çıkar
    await this.userModel.updateMany(
      { blockedUsers: userId, deletedAt: null },
      { $pull: { blockedUsers: userId } }
    );
    console.log('  ✅ Block ilişkileri temizlendi');

    // 7. Saved posts'ları temizle
    await this.userModel.updateOne(
      { _id: userId },
      { $set: { savedPosts: [] } }
    );

    // 8. UserCredentials'ı sil (hard delete - güvenlik için)
    await this.credentialsModel.deleteOne({ userId });
    console.log('  ✅ Kullanıcı kimlik bilgileri silindi');

    // 9. Son olarak User'ı soft delete yap
    await this.userModel.updateOne(
      { _id: userId },
      { $set: { deletedAt } }
    );
    console.log('  ✅ Kullanıcı hesabı soft delete yapıldı');

    // Invalidate feed cache (user's feed cache will be removed via TTL, but also clear it explicitly)
    await this.invalidateFeedCache(userId);

    // Invalidate user profile cache
    await this.redisService.del(`user:${userId}`);

    return { message: 'Account deleted successfully' };
  }

  // Helper method to invalidate feed cache
  private async invalidateFeedCache(userId: string): Promise<void> {
    try {
      // Get all feed cache keys for this user
      const keys = await this.redisService.keys(`feed:${userId}:*`);
      if (keys.length > 0) {
        await this.redisService.mdel(keys);
      }
    } catch (error) {
      // Log error but don't throw - cache invalidation should not break the flow
      console.error('Error invalidating feed cache:', error);
    }
  }
}
