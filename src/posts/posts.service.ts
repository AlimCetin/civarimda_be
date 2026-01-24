import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Types } from 'mongoose';
import { Post } from '../entities/post.entity';
import { Comment } from '../entities/comment.entity';
import { Notification } from '../entities/notification.entity';
import { User } from '../entities/user.entity';
import { Ad, AdStatus } from '../entities/ad.entity';
import { RedisService } from '../common/redis/redis.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<Post>,
    @InjectModel(Comment.name) private commentModel: Model<Comment>,
    @InjectModel(Notification.name) private notificationModel: Model<Notification>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Ad.name) private adModel: Model<Ad>,
    private readonly redisService: RedisService,
  ) { }

  async create(
    userId: string,
    image: string | undefined,
    caption: string,
    isPrivate: boolean = false,
    hiddenFromFollowers: string[] = [],
    video?: string,
  ) {
    if (!image && !video) {
      throw new BadRequestException('Either image or video is required');
    }

    const post = await this.postModel.create({
      userId,
      image: image || undefined,
      video: video || undefined,
      caption,
      isPrivate: isPrivate || false,
      hiddenFromFollowers: hiddenFromFollowers || [],
    });

    // Invalidate feed cache for the post owner (their own feed will change)
    await this.invalidateFeedCache(userId);

    return post;
  }

  async getLikes(postId: string, currentUserId: string, page: number = 1, limit: number = 20) {
    if (!Types.ObjectId.isValid(postId)) {
      throw new BadRequestException('Invalid post ID format');
    }

    const post = await this.postModel.findOne({ _id: postId, deletedAt: null }).select('userId likes isHidden isPrivate hiddenFromFollowers').lean();
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const postOwnerId = (post.userId as any)?.toString ? (post.userId as any).toString() : String(post.userId);

    if (currentUserId !== postOwnerId) {
      // Block checks
      const postOwner = await this.userModel.findOne({ _id: postOwnerId, deletedAt: null }).select('blockedUsers followers').lean();
      if (!postOwner) {
        throw new NotFoundException('Post owner not found');
      }
      if (postOwner.blockedUsers?.includes(currentUserId)) {
        throw new ForbiddenException('You are blocked by this user');
      }

      const currentUser = await this.userModel.findOne({ _id: currentUserId, deletedAt: null }).select('blockedUsers').lean();
      if (currentUser?.blockedUsers?.includes(postOwnerId)) {
        throw new ForbiddenException('You have blocked this user');
      }

      // Hidden post not visible to others
      if ((post as any).isHidden) {
        throw new NotFoundException('Post not found');
      }

      // Private post visibility
      if ((post as any).isPrivate) {
        const isFollowing = postOwner.followers?.some((id: any) => id.toString() === currentUserId) || false;
        if (!isFollowing) {
          throw new ForbiddenException('This post is only visible to followers');
        }
        const isHiddenFrom = (post as any).hiddenFromFollowers?.some((id: any) => id.toString() === currentUserId) || false;
        if (isHiddenFrom) {
          throw new ForbiddenException('This post is not visible to you');
        }
      }
    }

    const likeIds: string[] = ((post as any).likes || []).map((id: any) => id.toString());
    const skip = (page - 1) * limit;
    const maxLimit = Math.min(limit, 50);
    const pagedIds = likeIds.slice(skip, skip + maxLimit);

    const users = await this.userModel
      .find({ _id: { $in: pagedIds } })
      .select('fullName avatar')
      .lean();

    // Preserve order based on pagedIds
    const idToUser: Record<string, any> = {};
    for (const u of users) {
      idToUser[(u as any)._id.toString()] = u;
    }
    const orderedUsers = pagedIds
      .map((id) => {
        const u = idToUser[id];
        if (!u) return null;
        return {
          id,
          username: (u as any).fullName || '',
          fullName: (u as any).fullName || '',
          avatar: (u as any).avatar || null,
        };
      })
      .filter(Boolean);

    return {
      users: orderedUsers,
      pagination: {
        page,
        limit: maxLimit,
        hasMore: skip + maxLimit < likeIds.length,
      },
    };
  }

  async getFeed(userId: string, page: number = 1, limit: number = 20) {
    // Cache key: feed:userId:page:limit
    const cacheKey = `feed:${userId}:${page}:${limit}`;

    // Try to get from cache first
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const user = await this.userModel.findOne({ _id: userId, deletedAt: null }).select('following blockedUsers savedPosts role');
    if (!user) throw new NotFoundException('User not found');

    const following = [...user.following, userId];

    // Exclude blocked users from feed
    const blockedUsers = user.blockedUsers || [];
    const followingNotBlocked = following.filter(id => !blockedUsers.includes(id));

    // Also exclude users who have blocked the current user
    const usersWhoBlockedMe = await this.userModel.find({
      _id: { $in: following },
      blockedUsers: userId,
      deletedAt: null, // Soft delete kontrolü
    }).select('_id').lean();
    const blockedByUserIds = usersWhoBlockedMe.map(u => u._id.toString());
    const finalFollowing = followingNotBlocked.filter(id => !blockedByUserIds.includes(id));

    // Pagination
    const skip = (page - 1) * limit;
    const maxLimit = Math.min(limit, 50); // Maximum 50 posts per request

    const posts = await this.postModel.find({
      userId: { $in: finalFollowing },
      deletedAt: null, // Soft delete kontrolü
      $or: [
        { isHidden: false },
        { isHidden: { $exists: false } },
        { userId: userId } // Own posts always visible
      ]
    })
      .populate('userId', 'fullName avatar')
      .select('userId image video caption likes commentCount createdAt isHidden isPrivate hiddenFromFollowers')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(maxLimit)
      .lean();

    const savedPosts = user.savedPosts?.map((id: any) => id.toString()) || [];

    // Filter private posts - only show if user is following the post owner and not in hiddenFromFollowers
    const filteredPosts = posts.filter((post: any) => {
      const postOwnerId = (post.userId?._id || post.userId)?.toString();

      // Own posts always visible
      if (postOwnerId === userId) return true;

      // If post is private, check if current user is following and not hidden
      if (post.isPrivate) {
        const isFollowing = finalFollowing.includes(postOwnerId);
        const isHiddenFrom = post.hiddenFromFollowers?.some((id: any) => id.toString() === userId) || false;
        return isFollowing && !isHiddenFrom;
      }

      return true;
    });

    const formattedPosts = filteredPosts.map((post: any) => {
      const populatedUserId = post.userId?._id || post.userId;
      const userData = post.userId?._id
        ? post.userId
        : { _id: populatedUserId, fullName: '', avatar: null };

      return {
        id: post._id.toString(),
        type: 'post',
        userId: populatedUserId.toString(),
        user: {
          id: userData._id.toString(),
          username: userData.fullName || '',
          fullName: userData.fullName || '',
          avatar: userData.avatar || null,
        },
        image: post.image,
        video: (post as any).video || undefined,
        caption: post.caption || '',
        likeCount: post.likes?.length || 0,
        commentCount: post.commentCount || 0,
        isLiked: post.likes?.some((id: any) => id.toString() === userId) || false,
        isSaved: savedPosts.includes(post._id.toString()),
        createdAt: post.createdAt,
      };
    });

    // Get active ads and insert them into feed (admin and moderator can see ads too)
    let activeAds: any[] = [];
    try {
      const now = new Date();
      activeAds = await this.adModel.find({
        status: AdStatus.ACTIVE,
        startDate: { $lte: now },
        endDate: { $gte: now },
        $or: [
          { maxImpressions: 0 },
          { $expr: { $lt: ['$impressionCount', '$maxImpressions'] } },
        ],
      }).lean();
    } catch (error) {
      console.error('Error fetching ads:', error);
      // Continue without ads if there's an error
    }

    // Insert ads every 5 posts (configurable)
    const AD_INTERVAL = 5;
    const result: any[] = [];
    let adIndex = 0;

    for (let i = 0; i < formattedPosts.length; i++) {
      result.push(formattedPosts[i]);

      // Insert ad after every AD_INTERVAL posts
      if ((i + 1) % AD_INTERVAL === 0 && activeAds.length > 0) {
        const ad = activeAds[adIndex % activeAds.length];
        result.push({
          id: ad._id.toString(),
          type: 'ad',
          title: ad.title,
          description: ad.description,
          mediaUrl: ad.mediaUrl,
          linkUrl: ad.linkUrl,
          adType: ad.type,
          createdAt: ad.createdAt,
        });

        // Record impression asynchronously (don't wait)
        this.adModel.findByIdAndUpdate(ad._id, {
          $inc: { impressionCount: 1 },
        }).catch(err => {
          console.error('Error recording ad impression:', err);
        });

        adIndex++;
      }
    }

    const feedResult = {
      posts: result,
      pagination: {
        page,
        limit: maxLimit,
        hasMore: posts.length === maxLimit,
      },
    };

    // Cache the result (TTL: 5 minutes = 300 seconds)
    await this.redisService.set(cacheKey, JSON.stringify(feedResult), 300);

    return feedResult;
  }

  // Helper method to invalidate feed cache
  async invalidateFeedCache(userId: string): Promise<void> {
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

  async getUserPosts(userId: string, currentUserId?: string, page: number = 1, limit: number = 20) {
    // Validate ObjectId
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    // Check if current user is blocked by post owner (only if viewing someone else's profile)
    if (currentUserId && currentUserId !== userId) {
      const postOwner = await this.userModel.findOne({ _id: userId, deletedAt: null }).select('blockedUsers').lean();
      if (!postOwner) {
        throw new NotFoundException('User not found');
      }

      if (postOwner.blockedUsers?.includes(currentUserId)) {
        throw new ForbiddenException('You are blocked by this user');
      }

      // Check if current user has blocked post owner
      const currentUser = await this.userModel.findOne({ _id: currentUserId, deletedAt: null }).select('blockedUsers savedPosts').lean();
      if (currentUser?.blockedUsers?.includes(userId)) {
        throw new ForbiddenException('You have blocked this user');
      }
    }

    // Pagination
    const skip = (page - 1) * limit;
    const maxLimit = Math.min(limit, 50); // Maximum 50 posts per request

    // If viewing own profile, show all posts. Otherwise, hide hidden posts
    const query: any = { userId, deletedAt: null }; // Soft delete kontrolü
    if (currentUserId !== userId) {
      query.isHidden = { $ne: true };
    }

    const posts = await this.postModel.find(query)
      .populate('userId', 'fullName avatar')
      .select('userId image video caption likes commentCount createdAt isHidden isPrivate hiddenFromFollowers')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(maxLimit)
      .lean();

    // Filter private posts if viewing someone else's profile
    let filteredPosts = posts;
    if (currentUserId && currentUserId !== userId) {
      // Check if current user is following the post owner
      const postOwner = await this.userModel.findOne({ _id: userId, deletedAt: null }).select('followers').lean();
      if (!postOwner) {
        throw new NotFoundException('User not found');
      }

      const isFollowing = postOwner?.followers?.some((id: any) => id.toString() === currentUserId) || false;

      filteredPosts = posts.filter((post: any) => {
        // If post is private, only show if following and not in hiddenFromFollowers
        if (post.isPrivate) {
          if (!isFollowing) {
            // Not following, don't show private posts
            return false;
          }

          // Check if current user is in hiddenFromFollowers list
          const hiddenFromFollowers = post.hiddenFromFollowers || [];
          const isHiddenFrom = hiddenFromFollowers.some((id: any) => {
            const hiddenId = id?.toString ? id.toString() : String(id);
            const currentId = currentUserId.toString();
            return hiddenId === currentId;
          });

          // Show only if following AND not hidden from
          return !isHiddenFrom;
        }
        // Non-private posts are always visible (unless hidden)
        return true;
      });
    }

    let savedPosts: string[] = [];
    if (currentUserId) {
      const user = await this.userModel.findOne({ _id: currentUserId, deletedAt: null }).select('savedPosts').lean();
      savedPosts = user?.savedPosts?.map((id: any) => id.toString()) || [];
    }

    return {
      posts: filteredPosts.map((post: any) => {
        const populatedUserId = post.userId?._id || post.userId;
        const userData = post.userId?._id
          ? post.userId
          : { _id: populatedUserId, fullName: '', avatar: null };

        return {
          id: post._id.toString(),
          userId: populatedUserId.toString(),
          user: {
            id: userData._id.toString(),
            username: userData.fullName || '',
            fullName: userData.fullName || '',
            avatar: userData.avatar || null,
          },
          image: post.image,
          video: (post as any).video || undefined,
          caption: post.caption || '',
          likeCount: post.likes?.length || 0,
          commentCount: post.commentCount || 0,
          isLiked: currentUserId ? post.likes?.some((id: any) => id.toString() === currentUserId) || false : false,
          isSaved: currentUserId ? savedPosts.includes(post._id.toString()) : false,
          createdAt: post.createdAt,
        };
      }),
      pagination: {
        page,
        limit: maxLimit,
        hasMore: posts.length === maxLimit,
      },
    };
  }

  async getPostById(postId: string, currentUserId: string) {
    // Validate ObjectId
    if (!Types.ObjectId.isValid(postId)) {
      throw new BadRequestException('Invalid post ID format');
    }

    const post = await this.postModel.findOne({ _id: postId, deletedAt: null })
      .populate('userId', 'fullName avatar')
      .select('userId image video caption likes commentCount createdAt isHidden isPrivate hiddenFromFollowers')
      .lean();

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const postOwnerId = (post.userId as any)?._id?.toString() || (post.userId as any)?.toString() || post.userId?.toString();

    // Check if current user is blocked by post owner
    if (currentUserId !== postOwnerId) {
      const postOwner = await this.userModel.findById(postOwnerId).select('blockedUsers').lean();
      if (!postOwner) {
        throw new NotFoundException('Post owner not found');
      }

      if (postOwner.blockedUsers?.includes(currentUserId)) {
        throw new ForbiddenException('You are blocked by this user');
      }

      // Check if current user has blocked post owner
      const currentUser = await this.userModel.findOne({ _id: currentUserId, deletedAt: null }).select('blockedUsers savedPosts').lean();
      if (currentUser?.blockedUsers?.includes(postOwnerId)) {
        throw new ForbiddenException('You have blocked this user');
      }

      // Check if post is hidden
      if (post.isHidden) {
        throw new NotFoundException('Post not found');
      }

      // Check if post is private
      if (post.isPrivate) {
        // Check if current user is following the post owner
        const postOwnerWithFollowers = await this.userModel.findOne({ _id: postOwnerId, deletedAt: null }).select('followers').lean();
        const isFollowing = postOwnerWithFollowers?.followers?.some((id: any) => id.toString() === currentUserId) || false;

        if (!isFollowing) {
          throw new ForbiddenException('This post is only visible to followers');
        }

        // Check if current user is in hiddenFromFollowers list
        const hiddenFromFollowers = post.hiddenFromFollowers || [];
        const isHiddenFrom = hiddenFromFollowers.some((id: any) => {
          const hiddenId = id?.toString ? id.toString() : String(id);
          const currentId = currentUserId.toString();
          return hiddenId === currentId;
        });

        if (isHiddenFrom) {
          throw new ForbiddenException('This post is not visible to you');
        }
      }
    }

    // Get saved posts for current user
    const currentUser = await this.userModel.findById(currentUserId).select('savedPosts').lean();
    const savedPosts = currentUser?.savedPosts?.map((id: any) => id.toString()) || [];

    const populatedUserId = (post.userId as any)?._id || post.userId;
    const userDataRaw = (post.userId as any)?._id
      ? post.userId
      : { _id: populatedUserId, fullName: '', avatar: null };

    const userData = userDataRaw as any;

    return {
      id: post._id.toString(),
      userId: populatedUserId.toString(),
      user: {
        id: userData._id.toString(),
        username: userData.fullName || '',
        fullName: userData.fullName || '',
        avatar: userData.avatar || null,
      },
      image: post.image,
      video: (post as any).video || undefined,
      caption: post.caption || '',
      likeCount: post.likes?.length || 0,
      commentCount: post.commentCount || 0,
      isLiked: post.likes?.some((id: any) => id.toString() === currentUserId) || false,
      isSaved: savedPosts.includes(post._id.toString()),
      isHidden: post.isHidden || false,
      isPrivate: post.isPrivate || false,
      hiddenFromFollowers: (post.hiddenFromFollowers || []).map((id: any) => id.toString()),
      createdAt: (post as any).createdAt,
    };
  }

  async like(postId: string, userId: string) {
    const post = await this.postModel.findOne({ _id: postId, deletedAt: null }).populate('userId');
    if (!post) throw new NotFoundException('Post not found');

    // Check if user is blocked by post owner
    const postOwner = post.userId as any;
    if (postOwner.blockedUsers?.includes(userId)) {
      throw new ForbiddenException('You are blocked by this user');
    }

    const isLiked = post.likes.some((id: any) => id.toString() === userId);
    if (!isLiked) {
      await this.postModel.updateOne({ _id: postId }, { $addToSet: { likes: userId } });

      // Post sahibinin ID'sini string olarak al (populate edilmiş olabilir)
      const postOwnerId = (post.userId as any)?._id
        ? (post.userId as any)._id.toString()
        : post.userId.toString();

      if (postOwnerId !== userId) {
        console.log('📬 Like bildirimi oluşturuluyor:', {
          postOwnerId,
          fromUserId: userId,
          postId
        });

        await this.notificationModel.create({
          userId: postOwnerId,
          fromUserId: userId,
          type: 'like',
          postId: postId,
        });

        // Increment notification count cache
        const cacheKey = `notification:unread:${postOwnerId}`;
        const cached = await this.redisService.get(cacheKey);
        if (cached !== null) {
          await this.redisService.incr(cacheKey);
          await this.redisService.expire(cacheKey, 60);
        } else {
          await this.redisService.set(cacheKey, '1', 60);
        }
      }
      return { message: 'Liked' };
    }
    return { message: 'Already liked' };
  }

  async unlike(postId: string, userId: string) {
    const post = await this.postModel.findOne({ _id: postId, deletedAt: null });
    if (!post) throw new NotFoundException('Post not found');

    const isLiked = post.likes.some((id: any) => id.toString() === userId);
    if (isLiked) {
      await this.postModel.updateOne({ _id: postId }, { $pull: { likes: userId } });
      return { message: 'Unliked' };
    }
    return { message: 'Already unliked' };
  }

  async getComments(postId: string, page: number = 1, limit: number = 20) {
    // Pagination
    const skip = (page - 1) * limit;
    const maxLimit = Math.min(limit, 50); // Maximum 50 comments per request

    const comments = await this.commentModel.find({ postId, deletedAt: null }) // Soft delete kontrolü
      .populate('userId', 'fullName avatar')
      .select('userId text createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(maxLimit)
      .lean();

    return {
      comments: comments.map((comment: any) => {
        const populatedUserId = comment.userId?._id || comment.userId;
        const userData = comment.userId?._id
          ? comment.userId
          : { _id: populatedUserId, fullName: '', avatar: null };

        return {
          id: comment._id.toString(),
          userId: populatedUserId.toString(),
          user: {
            id: userData._id.toString(),
            username: userData.fullName || '',
            fullName: userData.fullName || '',
            avatar: userData.avatar || null,
          },
          text: comment.text || '',
          createdAt: comment.createdAt,
        };
      }),
      pagination: {
        page,
        limit: maxLimit,
        hasMore: comments.length === maxLimit,
      },
    };
  }

  async addComment(postId: string, userId: string, text: string) {
    const post = await this.postModel.findOne({ _id: postId, deletedAt: null }).populate('userId');
    if (!post) throw new NotFoundException('Post not found');

    // Check if user is blocked by post owner
    const postOwner = post.userId as any;
    if (postOwner.blockedUsers?.includes(userId)) {
      throw new ForbiddenException('You are blocked by this user');
    }

    const comment = await this.commentModel.create({ postId, userId, text });
    await this.postModel.updateOne({ _id: postId }, { $inc: { commentCount: 1 } });

    // Post sahibinin ID'sini string olarak al (populate edilmiş olabilir)
    const postOwnerId = (post.userId as any)?._id
      ? (post.userId as any)._id.toString()
      : post.userId.toString();

    if (postOwnerId !== userId) {
      console.log('📬 Comment bildirimi oluşturuluyor:', {
        postOwnerId,
        fromUserId: userId,
        postId
      });

      await this.notificationModel.create({
        userId: postOwnerId,
        fromUserId: userId,
        type: 'comment',
        postId: postId,
      });

      // Increment notification count cache
      const cacheKey = `notification:unread:${postOwnerId}`;
      const cached = await this.redisService.get(cacheKey);
      if (cached !== null) {
        await this.redisService.incr(cacheKey);
        await this.redisService.expire(cacheKey, 60);
      } else {
        await this.redisService.set(cacheKey, '1', 60);
      }
    }

    const populatedComment = await comment.populate('userId', 'fullName avatar');
    const populatedUserId = (populatedComment as any).userId._id || (populatedComment as any).userId;
    const userData = typeof (populatedComment as any).userId === 'object' && (populatedComment as any).userId._id
      ? (populatedComment as any).userId
      : { _id: populatedUserId, fullName: '', avatar: null };

    return {
      id: populatedComment._id.toString(),
      userId: populatedUserId.toString(),
      user: {
        id: userData._id.toString(),
        username: userData.fullName || '',
        fullName: userData.fullName || '',
        avatar: userData.avatar || null,
      },
      text: populatedComment.text || '',
      createdAt: (populatedComment as any).createdAt,
    };
  }

  async savePost(postId: string, userId: string) {
    const post = await this.postModel.findOne({ _id: postId, deletedAt: null });
    if (!post) throw new NotFoundException('Post not found');

    await this.userModel.updateOne(
      { _id: userId },
      { $addToSet: { savedPosts: postId } }
    );

    return { message: 'Post saved' };
  }

  async unsavePost(postId: string, userId: string) {
    const post = await this.postModel.findOne({ _id: postId, deletedAt: null });
    if (!post) throw new NotFoundException('Post not found');

    await this.userModel.updateOne(
      { _id: userId },
      { $pull: { savedPosts: postId } }
    );

    return { message: 'Post unsaved' };
  }

  async getSavedPosts(userId: string, page: number = 1, limit: number = 20) {
    // Get user's saved post IDs
    const user = await this.userModel.findOne({ _id: userId, deletedAt: null }).select('savedPosts blockedUsers').lean();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const savedPostIds = user.savedPosts?.map((id: any) => id.toString()) || [];

    if (savedPostIds.length === 0) {
      return {
        posts: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasMore: false,
        },
      };
    }

    // Pagination
    const skip = (page - 1) * limit;
    const maxLimit = Math.min(limit, 50);

    // Get saved posts
    const posts = await this.postModel
      .find({
        _id: { $in: savedPostIds },
        deletedAt: null,
      })
      .populate('userId', 'fullName avatar')
      .select('userId image video caption likes commentCount createdAt isHidden isPrivate hiddenFromFollowers')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(maxLimit)
      .lean();

    // Filter blocked users' posts
    const blockedUsers = user.blockedUsers?.map((id: any) => id.toString()) || [];
    let filteredPosts = posts.filter((post: any) => {
      const postOwnerId = post.userId?._id?.toString() || post.userId?.toString();
      return !blockedUsers.includes(postOwnerId);
    });

    // Check if post owners have blocked current user
    const postOwnerIds = filteredPosts.map((post: any) => {
      return post.userId?._id?.toString() || post.userId?.toString();
    }).filter(Boolean);

    if (postOwnerIds.length > 0) {
      const usersWhoBlockedMe = await this.userModel.find({
        _id: { $in: postOwnerIds },
        blockedUsers: userId,
        deletedAt: null,
      }).select('_id').lean();

      const blockedByUserIds = usersWhoBlockedMe.map((u: any) => u._id.toString());
      filteredPosts = filteredPosts.filter((post: any) => {
        const postOwnerId = post.userId?._id?.toString() || post.userId?.toString();
        return !blockedByUserIds.includes(postOwnerId);
      });
    }

    // Format posts
    const formattedPosts = filteredPosts.map((post: any) => {
      const populatedUserId = post.userId?._id || post.userId;
      const userData = post.userId as any;

      return {
        id: post._id.toString(),
        userId: populatedUserId.toString(),
        user: {
          id: userData?._id?.toString() || userData?.toString() || '',
          username: userData?.fullName || '',
          fullName: userData?.fullName || '',
          avatar: userData?.avatar || null,
        },
        image: post.image,
        video: post.video || undefined,
        caption: post.caption || '',
        likeCount: post.likes?.length || 0,
        commentCount: post.commentCount || 0,
        isLiked: post.likes?.some((id: any) => id.toString() === userId) || false,
        isSaved: true, // All posts in savedPosts are saved
        isHidden: post.isHidden || false,
        isPrivate: post.isPrivate || false,
        hiddenFromFollowers: (post.hiddenFromFollowers || []).map((id: any) => id.toString()),
        createdAt: post.createdAt,
      };
    });

    const total = savedPostIds.length;
    const totalPages = Math.ceil(total / limit);

    return {
      posts: formattedPosts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  }

  async hidePost(postId: string, userId: string) {
    const post = await this.postModel.findOne({ _id: postId, deletedAt: null });
    if (!post) throw new NotFoundException('Post not found');

    if (post.userId.toString() !== userId) {
      throw new ForbiddenException('You can only hide your own posts');
    }

    post.isHidden = true;
    await post.save();

    return { message: 'Post hidden successfully' };
  }

  async unhidePost(postId: string, userId: string) {
    const post = await this.postModel.findOne({ _id: postId, deletedAt: null });
    if (!post) throw new NotFoundException('Post not found');

    if (post.userId.toString() !== userId) {
      throw new ForbiddenException('You can only unhide your own posts');
    }

    post.isHidden = false;
    await post.save();

    return { message: 'Post unhidden successfully' };
  }

  async deletePost(postId: string, userId: string) {
    const post = await this.postModel.findOne({ _id: postId, deletedAt: null });
    if (!post) throw new NotFoundException('Post not found');

    if (post.userId.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    // Soft delete all comments
    await this.commentModel.updateMany(
      { postId, deletedAt: null },
      { $set: { deletedAt: new Date() } }
    );

    // Soft delete all notifications related to this post
    await this.notificationModel.updateMany(
      { postId, deletedAt: null },
      { $set: { deletedAt: new Date() } }
    );

    // Remove post from all users' savedPosts
    await this.userModel.updateMany(
      { savedPosts: postId },
      { $pull: { savedPosts: postId } }
    );

    // Soft delete the post
    await this.postModel.updateOne(
      { _id: postId },
      { $set: { deletedAt: new Date() } }
    );

    // Invalidate feed cache for the post owner
    await this.invalidateFeedCache(userId);

    return { message: 'Post deleted successfully' };
  }

  async updateVisibility(
    postId: string,
    userId: string,
    payload: { isPrivate?: boolean; isHidden?: boolean; hiddenFromFollowers?: string[] },
  ) {
    console.log('📥 Backend updateVisibility called:', {
      postId,
      userId,
      payload,
    });

    const post = await this.postModel.findOne({ _id: postId, deletedAt: null });
    if (!post) throw new NotFoundException('Post not found');

    if (post.userId.toString() !== userId) {
      throw new ForbiddenException('You can only update your own posts');
    }

    const update: any = {};
    if (typeof payload.isPrivate === 'boolean') update.isPrivate = payload.isPrivate;
    if (typeof payload.isHidden === 'boolean') update.isHidden = payload.isHidden;
    if (Array.isArray(payload.hiddenFromFollowers)) update.hiddenFromFollowers = payload.hiddenFromFollowers;

    console.log('💾 Updating post with:', update);

    await this.postModel.updateOne({ _id: postId, deletedAt: null }, { $set: update });

    const updatedPost = await this.postModel.findOne({ _id: postId, deletedAt: null }).lean();
    if (updatedPost) {
      console.log('✅ Post updated successfully:', {
        isPrivate: updatedPost.isPrivate,
        hiddenFromFollowers: updatedPost.hiddenFromFollowers,
      });
    }

    return { message: 'Visibility updated', update };
  }

  async sharePost(postId: string, userId: string, receiverId: string) {
    const post = await this.postModel.findOne({ _id: postId, deletedAt: null });
    if (!post) throw new NotFoundException('Post not found');

    // Share işlemi için message service kullanılacak
    // Bu method sadece post bilgisini döndürür, gerçek gönderme message service'de yapılır
    return {
      postId: post._id.toString(),
      image: post.image,
      caption: post.caption,
    };
  }
}
