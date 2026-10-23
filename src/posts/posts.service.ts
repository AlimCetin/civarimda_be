import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import { Post } from '../entities/post.entity';
import { Comment } from '../entities/comment.entity';
import { Notification } from '../entities/notification.entity';
import { User } from '../entities/user.entity';
import { Ad, AdStatus } from '../entities/ad.entity';
import { RedisService } from '../common/redis/redis.service';
import { isValidId } from '../common/utils/id.util';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post) private postRepository: Repository<Post>,
    @InjectRepository(Comment) private commentRepository: Repository<Comment>,
    @InjectRepository(Notification) private notificationRepository: Repository<Notification>,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Ad) private adRepository: Repository<Ad>,
    private readonly redisService: RedisService,
  ) {}

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

    const post = this.postRepository.create({
      userId,
      image: image || null,
      video: video || null,
      caption: caption || '',
      likes: [],
      commentCount: 0,
      isHidden: false,
      isPrivate: isPrivate || false,
      hiddenFromFollowers: hiddenFromFollowers || [],
    });

    await this.postRepository.save(post);
    await this.invalidateFeedCache(userId);

    return {
      ...post,
      id: post.id,
      _id: post.id,
    };
  }

  async getLikes(postId: string, currentUserId: string, page: number = 1, limit: number = 20) {
    if (!isValidId(postId)) {
      throw new BadRequestException('Invalid post ID format');
    }

    const post = await this.postRepository.findOne({
      where: { id: postId, deletedAt: IsNull() },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const postOwnerId = post.userId;

    if (currentUserId !== postOwnerId) {
      const postOwner = await this.userRepository.findOne({
        where: { id: postOwnerId, deletedAt: IsNull() },
      });
      if (!postOwner) {
        throw new NotFoundException('Post owner not found');
      }
      if (postOwner.blockedUsers?.includes(currentUserId)) {
        throw new ForbiddenException('You are blocked by this user');
      }

      const currentUser = await this.userRepository.findOne({
        where: { id: currentUserId, deletedAt: IsNull() },
      });
      if (currentUser?.blockedUsers?.includes(postOwnerId)) {
        throw new ForbiddenException('You have blocked this user');
      }

      if (post.isHidden) {
        throw new NotFoundException('Post not found');
      }

      if (post.isPrivate) {
        const isFollowing = postOwner.followers?.includes(currentUserId) || false;
        if (!isFollowing) {
          throw new ForbiddenException('This post is only visible to followers');
        }
        const isHiddenFrom = post.hiddenFromFollowers?.includes(currentUserId) || false;
        if (isHiddenFrom) {
          throw new ForbiddenException('This post is not visible to you');
        }
      }
    }

    const likeIds: string[] = post.likes || [];
    const skip = (page - 1) * limit;
    const maxLimit = Math.min(limit, 50);
    const pagedIds = likeIds.slice(skip, skip + maxLimit);

    if (pagedIds.length === 0) {
      return {
        users: [],
        pagination: {
          page,
          limit: maxLimit,
          hasMore: false,
        },
      };
    }

    const users = await this.userRepository.find({
      where: { id: In(pagedIds) },
      select: ['id', 'fullName', 'avatar'],
    });

    const idToUser = new Map(users.map((u) => [u.id, u]));
    const orderedUsers = pagedIds
      .map((id) => {
        const u = idToUser.get(id);
        if (!u) return null;
        return {
          id: u.id,
          _id: u.id,
          username: u.fullName || '',
          fullName: u.fullName || '',
          avatar: u.avatar || null,
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
    const cacheKey = `feed:${userId}:${page}:${limit}`;

    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const user = await this.userRepository.findOne({
      where: { id: userId, deletedAt: IsNull() },
    });
    if (!user) throw new NotFoundException('User not found');

    const following = [...(user.following || []), userId];
    const blockedUsers = user.blockedUsers || [];
    const followingNotBlocked = following.filter((id) => !blockedUsers.includes(id));

    // Exclude users who have blocked current user
    let finalFollowing = followingNotBlocked;
    if (followingNotBlocked.length > 0) {
      const usersWhoBlockedMe = await this.userRepository
        .createQueryBuilder('u')
        .where('u.id IN (:...ids)', { ids: followingNotBlocked })
        .andWhere(':userId = ANY(u.blockedUsers)', { userId })
        .andWhere('u.deletedAt IS NULL')
        .select(['u.id'])
        .getMany();

      const blockedByUserIds = usersWhoBlockedMe.map((u) => u.id);
      finalFollowing = followingNotBlocked.filter((id) => !blockedByUserIds.includes(id));
    }

    if (finalFollowing.length === 0) {
      finalFollowing = [userId];
    }

    const skip = (page - 1) * limit;
    const maxLimit = Math.min(limit, 50);

    const posts = await this.postRepository
      .createQueryBuilder('post')
      .where('post.deletedAt IS NULL')
      .andWhere('post.userId IN (:...following)', { following: finalFollowing })
      .andWhere('(post.isHidden = false OR post.userId = :userId)', { userId })
      .orderBy('post.createdAt', 'DESC')
      .skip(skip)
      .take(maxLimit)
      .getMany();

    const savedPosts = user.savedPosts || [];

    // Filter private posts
    const filteredPosts = posts.filter((post) => {
      const postOwnerId = post.userId;
      if (postOwnerId === userId) return true;

      if (post.isPrivate) {
        const isFollowing = finalFollowing.includes(postOwnerId);
        const isHiddenFrom = post.hiddenFromFollowers?.includes(userId) || false;
        return isFollowing && !isHiddenFrom;
      }
      return true;
    });

    // Populate user info for posts
    const authorIds = Array.from(new Set(filteredPosts.map((p) => p.userId)));
    let authorMap = new Map<string, User>();
    if (authorIds.length > 0) {
      const authors = await this.userRepository.find({
        where: { id: In(authorIds) },
        select: ['id', 'fullName', 'avatar'],
      });
      authorMap = new Map(authors.map((a) => [a.id, a]));
    }

    const formattedPosts = filteredPosts.map((post) => {
      const author = authorMap.get(post.userId);
      return {
        id: post.id,
        _id: post.id,
        type: 'post',
        userId: post.userId,
        user: {
          id: post.userId,
          _id: post.userId,
          username: author?.fullName || '',
          fullName: author?.fullName || '',
          avatar: author?.avatar || null,
        },
        image: post.image,
        video: post.video || undefined,
        caption: post.caption || '',
        likeCount: post.likes?.length || 0,
        commentCount: post.commentCount || 0,
        isLiked: post.likes?.includes(userId) || false,
        isSaved: savedPosts.includes(post.id),
        createdAt: post.createdAt,
      };
    });

    // Fetch active ads
    let activeAds: Ad[] = [];
    try {
      const now = new Date();
      activeAds = await this.adRepository
        .createQueryBuilder('ad')
        .where('ad.status = :status', { status: AdStatus.ACTIVE })
        .andWhere('ad.startDate <= :now AND ad.endDate >= :now', { now })
        .andWhere('(ad.maxImpressions = 0 OR ad.impressionCount < ad.maxImpressions)')
        .getMany();
    } catch (error) {
      console.error('Error fetching ads:', error);
    }

    const AD_INTERVAL = 5;
    const result: any[] = [];
    let adIndex = 0;

    for (let i = 0; i < formattedPosts.length; i++) {
      result.push(formattedPosts[i]);

      if ((i + 1) % AD_INTERVAL === 0 && activeAds.length > 0) {
        const ad = activeAds[adIndex % activeAds.length];
        result.push({
          id: ad.id,
          _id: ad.id,
          type: 'ad',
          title: ad.title,
          description: ad.description,
          mediaUrl: ad.mediaUrl,
          linkUrl: ad.linkUrl,
          adType: ad.type,
          createdAt: ad.createdAt,
        });

        this.adRepository.increment({ id: ad.id }, 'impressionCount', 1).catch((err) => {
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

    await this.redisService.set(cacheKey, JSON.stringify(feedResult), 300);
    return feedResult;
  }

  async invalidateFeedCache(userId: string): Promise<void> {
    try {
      const keys = await this.redisService.keys(`feed:${userId}:*`);
      if (keys.length > 0) {
        await this.redisService.mdel(keys);
      }
    } catch (error) {
      console.error('Error invalidating feed cache:', error);
    }
  }

  async getUserPosts(userId: string, currentUserId?: string, page: number = 1, limit: number = 20) {
    if (!isValidId(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    if (currentUserId && currentUserId !== userId) {
      const postOwner = await this.userRepository.findOne({
        where: { id: userId, deletedAt: IsNull() },
      });
      if (!postOwner) {
        throw new NotFoundException('User not found');
      }

      if (postOwner.blockedUsers?.includes(currentUserId)) {
        throw new ForbiddenException('You are blocked by this user');
      }

      const currentUser = await this.userRepository.findOne({
        where: { id: currentUserId, deletedAt: IsNull() },
      });
      if (currentUser?.blockedUsers?.includes(userId)) {
        throw new ForbiddenException('You have blocked this user');
      }
    }

    const skip = (page - 1) * limit;
    const maxLimit = Math.min(limit, 50);

    const query = this.postRepository
      .createQueryBuilder('post')
      .where('post.userId = :userId', { userId })
      .andWhere('post.deletedAt IS NULL');

    if (currentUserId !== userId) {
      query.andWhere('post.isHidden = false');
    }

    const posts = await query.orderBy('post.createdAt', 'DESC').skip(skip).take(maxLimit).getMany();

    let filteredPosts = posts;
    if (currentUserId && currentUserId !== userId) {
      const postOwner = await this.userRepository.findOne({
        where: { id: userId, deletedAt: IsNull() },
      });
      const isFollowing = postOwner?.followers?.includes(currentUserId) || false;

      filteredPosts = posts.filter((post) => {
        if (post.isPrivate) {
          if (!isFollowing) return false;
          const isHiddenFrom = post.hiddenFromFollowers?.includes(currentUserId) || false;
          return !isHiddenFrom;
        }
        return true;
      });
    }

    let savedPosts: string[] = [];
    if (currentUserId) {
      const user = await this.userRepository.findOne({
        where: { id: currentUserId, deletedAt: IsNull() },
      });
      savedPosts = user?.savedPosts || [];
    }

    const postOwner = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'fullName', 'avatar'],
    });

    return {
      posts: filteredPosts.map((post) => ({
        id: post.id,
        _id: post.id,
        userId: post.userId,
        user: {
          id: post.userId,
          _id: post.userId,
          username: postOwner?.fullName || '',
          fullName: postOwner?.fullName || '',
          avatar: postOwner?.avatar || null,
        },
        image: post.image,
        video: post.video || undefined,
        caption: post.caption || '',
        likeCount: post.likes?.length || 0,
        commentCount: post.commentCount || 0,
        isLiked: currentUserId ? post.likes?.includes(currentUserId) || false : false,
        isSaved: currentUserId ? savedPosts.includes(post.id) : false,
        createdAt: post.createdAt,
      })),
      pagination: {
        page,
        limit: maxLimit,
        hasMore: posts.length === maxLimit,
      },
    };
  }

  async getPostById(postId: string, currentUserId: string) {
    if (!isValidId(postId)) {
      throw new BadRequestException('Invalid post ID format');
    }

    const post = await this.postRepository.findOne({
      where: { id: postId, deletedAt: IsNull() },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const postOwnerId = post.userId;

    if (currentUserId !== postOwnerId) {
      const postOwner = await this.userRepository.findOne({
        where: { id: postOwnerId, deletedAt: IsNull() },
      });
      if (!postOwner) {
        throw new NotFoundException('Post owner not found');
      }

      if (postOwner.blockedUsers?.includes(currentUserId)) {
        throw new ForbiddenException('You are blocked by this user');
      }

      const currentUser = await this.userRepository.findOne({
        where: { id: currentUserId, deletedAt: IsNull() },
      });
      if (currentUser?.blockedUsers?.includes(postOwnerId)) {
        throw new ForbiddenException('You have blocked this user');
      }

      if (post.isHidden) {
        throw new NotFoundException('Post not found');
      }

      if (post.isPrivate) {
        const isFollowing = postOwner.followers?.includes(currentUserId) || false;
        if (!isFollowing) {
          throw new ForbiddenException('This post is only visible to followers');
        }

        const isHiddenFrom = post.hiddenFromFollowers?.includes(currentUserId) || false;
        if (isHiddenFrom) {
          throw new ForbiddenException('This post is not visible to you');
        }
      }
    }

    const currentUser = await this.userRepository.findOne({
      where: { id: currentUserId, deletedAt: IsNull() },
    });
    const savedPosts = currentUser?.savedPosts || [];

    const author = await this.userRepository.findOne({
      where: { id: postOwnerId },
      select: ['id', 'fullName', 'avatar'],
    });

    return {
      id: post.id,
      _id: post.id,
      userId: post.userId,
      user: {
        id: post.userId,
        _id: post.userId,
        username: author?.fullName || '',
        fullName: author?.fullName || '',
        avatar: author?.avatar || null,
      },
      image: post.image,
      video: post.video || undefined,
      caption: post.caption || '',
      likeCount: post.likes?.length || 0,
      commentCount: post.commentCount || 0,
      isLiked: post.likes?.includes(currentUserId) || false,
      isSaved: savedPosts.includes(post.id),
      isHidden: post.isHidden || false,
      isPrivate: post.isPrivate || false,
      hiddenFromFollowers: post.hiddenFromFollowers || [],
      createdAt: post.createdAt,
    };
  }

  async like(postId: string, userId: string) {
    const post = await this.postRepository.findOne({
      where: { id: postId, deletedAt: IsNull() },
    });
    if (!post) throw new NotFoundException('Post not found');

    const postOwner = await this.userRepository.findOne({
      where: { id: post.userId, deletedAt: IsNull() },
    });
    if (postOwner?.blockedUsers?.includes(userId)) {
      throw new ForbiddenException('You are blocked by this user');
    }

    const isLiked = post.likes?.includes(userId) || false;
    if (!isLiked) {
      post.likes = [...(post.likes || []), userId];
      await this.postRepository.save(post);

      if (post.userId !== userId) {
        const notification = this.notificationRepository.create({
          userId: post.userId,
          fromUserId: userId,
          type: 'like',
          postId: postId,
        });
        await this.notificationRepository.save(notification);

        const cacheKey = `notification:unread:${post.userId}`;
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
    const post = await this.postRepository.findOne({
      where: { id: postId, deletedAt: IsNull() },
    });
    if (!post) throw new NotFoundException('Post not found');

    const isLiked = post.likes?.includes(userId) || false;
    if (isLiked) {
      post.likes = (post.likes || []).filter((id) => id !== userId);
      await this.postRepository.save(post);
      return { message: 'Unliked' };
    }
    return { message: 'Already unliked' };
  }

  async getComments(postId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const maxLimit = Math.min(limit, 50);

    const comments = await this.commentRepository.find({
      where: { postId, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
      skip,
      take: maxLimit,
    });

    const userIds = Array.from(new Set(comments.map((c) => c.userId)));
    let userMap = new Map<string, User>();
    if (userIds.length > 0) {
      const users = await this.userRepository.find({
        where: { id: In(userIds) },
        select: ['id', 'fullName', 'avatar'],
      });
      userMap = new Map(users.map((u) => [u.id, u]));
    }

    return {
      comments: comments.map((comment) => {
        const u = userMap.get(comment.userId);
        return {
          id: comment.id,
          _id: comment.id,
          userId: comment.userId,
          user: {
            id: comment.userId,
            _id: comment.userId,
            username: u?.fullName || '',
            fullName: u?.fullName || '',
            avatar: u?.avatar || null,
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
    const post = await this.postRepository.findOne({
      where: { id: postId, deletedAt: IsNull() },
    });
    if (!post) throw new NotFoundException('Post not found');

    const postOwner = await this.userRepository.findOne({
      where: { id: post.userId, deletedAt: IsNull() },
    });
    if (postOwner?.blockedUsers?.includes(userId)) {
      throw new ForbiddenException('You are blocked by this user');
    }

    const comment = this.commentRepository.create({ postId, userId, text });
    await this.commentRepository.save(comment);

    post.commentCount = (post.commentCount || 0) + 1;
    await this.postRepository.save(post);

    if (post.userId !== userId) {
      const notification = this.notificationRepository.create({
        userId: post.userId,
        fromUserId: userId,
        type: 'comment',
        postId: postId,
      });
      await this.notificationRepository.save(notification);

      const cacheKey = `notification:unread:${post.userId}`;
      const cached = await this.redisService.get(cacheKey);
      if (cached !== null) {
        await this.redisService.incr(cacheKey);
        await this.redisService.expire(cacheKey, 60);
      } else {
        await this.redisService.set(cacheKey, '1', 60);
      }
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'fullName', 'avatar'],
    });

    return {
      id: comment.id,
      _id: comment.id,
      userId,
      user: {
        id: userId,
        _id: userId,
        username: user?.fullName || '',
        fullName: user?.fullName || '',
        avatar: user?.avatar || null,
      },
      text: comment.text,
      createdAt: comment.createdAt,
    };
  }

  async savePost(postId: string, userId: string) {
    const post = await this.postRepository.findOne({
      where: { id: postId, deletedAt: IsNull() },
    });
    if (!post) throw new NotFoundException('Post not found');

    const user = await this.userRepository.findOne({
      where: { id: userId, deletedAt: IsNull() },
    });
    if (!user) throw new NotFoundException('User not found');

    if (!user.savedPosts?.includes(postId)) {
      user.savedPosts = [...(user.savedPosts || []), postId];
      await this.userRepository.save(user);
    }

    return { message: 'Post saved' };
  }

  async unsavePost(postId: string, userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId, deletedAt: IsNull() },
    });
    if (!user) throw new NotFoundException('User not found');

    user.savedPosts = (user.savedPosts || []).filter((id) => id !== postId);
    await this.userRepository.save(user);

    return { message: 'Post unsaved' };
  }

  async getSavedPosts(userId: string, page: number = 1, limit: number = 20) {
    const user = await this.userRepository.findOne({
      where: { id: userId, deletedAt: IsNull() },
    });
    if (!user) throw new NotFoundException('User not found');

    const savedPostIds = user.savedPosts || [];
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

    const skip = (page - 1) * limit;
    const maxLimit = Math.min(limit, 50);

    const posts = await this.postRepository.find({
      where: { id: In(savedPostIds), deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
      skip,
      take: maxLimit,
    });

    const blockedUsers = user.blockedUsers || [];
    let filteredPosts = posts.filter((p) => !blockedUsers.includes(p.userId));

    const postOwnerIds = Array.from(new Set(filteredPosts.map((p) => p.userId)));
    let authorMap = new Map<string, User>();
    if (postOwnerIds.length > 0) {
      const usersWhoBlockedMe = await this.userRepository
        .createQueryBuilder('u')
        .where('u.id IN (:...ids)', { ids: postOwnerIds })
        .andWhere(':userId = ANY(u.blockedUsers)', { userId })
        .andWhere('u.deletedAt IS NULL')
        .select(['u.id'])
        .getMany();

      const blockedByUserIds = usersWhoBlockedMe.map((u) => u.id);
      filteredPosts = filteredPosts.filter((p) => !blockedByUserIds.includes(p.userId));

      const authors = await this.userRepository.find({
        where: { id: In(postOwnerIds) },
        select: ['id', 'fullName', 'avatar'],
      });
      authorMap = new Map(authors.map((a) => [a.id, a]));
    }

    const formattedPosts = filteredPosts.map((post) => {
      const author = authorMap.get(post.userId);
      return {
        id: post.id,
        _id: post.id,
        userId: post.userId,
        user: {
          id: post.userId,
          _id: post.userId,
          username: author?.fullName || '',
          fullName: author?.fullName || '',
          avatar: author?.avatar || null,
        },
        image: post.image,
        video: post.video || undefined,
        caption: post.caption || '',
        likeCount: post.likes?.length || 0,
        commentCount: post.commentCount || 0,
        isLiked: post.likes?.includes(userId) || false,
        isSaved: true,
        isHidden: post.isHidden || false,
        isPrivate: post.isPrivate || false,
        hiddenFromFollowers: post.hiddenFromFollowers || [],
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
    const post = await this.postRepository.findOne({
      where: { id: postId, deletedAt: IsNull() },
    });
    if (!post) throw new NotFoundException('Post not found');

    if (post.userId !== userId) {
      throw new ForbiddenException('You can only hide your own posts');
    }

    post.isHidden = true;
    await this.postRepository.save(post);
    return { message: 'Post hidden successfully' };
  }

  async unhidePost(postId: string, userId: string) {
    const post = await this.postRepository.findOne({
      where: { id: postId, deletedAt: IsNull() },
    });
    if (!post) throw new NotFoundException('Post not found');

    if (post.userId !== userId) {
      throw new ForbiddenException('You can only unhide your own posts');
    }

    post.isHidden = false;
    await this.postRepository.save(post);
    return { message: 'Post unhidden successfully' };
  }

  async deletePost(postId: string, userId: string) {
    const post = await this.postRepository.findOne({
      where: { id: postId, deletedAt: IsNull() },
    });
    if (!post) throw new NotFoundException('Post not found');

    if (post.userId !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    const deletedAt = new Date();

    await this.commentRepository.update(
      { postId, deletedAt: IsNull() },
      { deletedAt },
    );

    await this.notificationRepository.update(
      { postId, deletedAt: IsNull() },
      { deletedAt },
    );

    post.deletedAt = deletedAt;
    await this.postRepository.save(post);

    await this.invalidateFeedCache(userId);
    return { message: 'Post deleted successfully' };
  }

  async updateVisibility(
    postId: string,
    userId: string,
    payload: { isPrivate?: boolean; isHidden?: boolean; hiddenFromFollowers?: string[] },
  ) {
    const post = await this.postRepository.findOne({
      where: { id: postId, deletedAt: IsNull() },
    });
    if (!post) throw new NotFoundException('Post not found');

    if (post.userId !== userId) {
      throw new ForbiddenException('You can only update your own posts');
    }

    if (typeof payload.isPrivate === 'boolean') post.isPrivate = payload.isPrivate;
    if (typeof payload.isHidden === 'boolean') post.isHidden = payload.isHidden;
    if (Array.isArray(payload.hiddenFromFollowers)) post.hiddenFromFollowers = payload.hiddenFromFollowers;

    await this.postRepository.save(post);
    return { message: 'Visibility updated', update: payload };
  }

  async sharePost(postId: string, userId: string, receiverId: string) {
    const post = await this.postRepository.findOne({
      where: { id: postId, deletedAt: IsNull() },
    });
    if (!post) throw new NotFoundException('Post not found');

    return {
      postId: post.id,
      image: post.image,
      caption: post.caption,
    };
  }
}
