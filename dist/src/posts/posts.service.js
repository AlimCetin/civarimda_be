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
exports.PostsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const post_entity_1 = require("../entities/post.entity");
const comment_entity_1 = require("../entities/comment.entity");
const notification_entity_1 = require("../entities/notification.entity");
const user_entity_1 = require("../entities/user.entity");
const ad_entity_1 = require("../entities/ad.entity");
const redis_service_1 = require("../common/redis/redis.service");
const id_util_1 = require("../common/utils/id.util");
let PostsService = class PostsService {
    postRepository;
    commentRepository;
    notificationRepository;
    userRepository;
    adRepository;
    redisService;
    constructor(postRepository, commentRepository, notificationRepository, userRepository, adRepository, redisService) {
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.adRepository = adRepository;
        this.redisService = redisService;
    }
    async create(userId, image, caption, isPrivate = false, hiddenFromFollowers = [], video) {
        if (!image && !video) {
            throw new common_1.BadRequestException('Either image or video is required');
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
    async getLikes(postId, currentUserId, page = 1, limit = 20) {
        if (!(0, id_util_1.isValidId)(postId)) {
            throw new common_1.BadRequestException('Invalid post ID format');
        }
        const post = await this.postRepository.findOne({
            where: { id: postId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!post) {
            throw new common_1.NotFoundException('Post not found');
        }
        const postOwnerId = post.userId;
        if (currentUserId !== postOwnerId) {
            const postOwner = await this.userRepository.findOne({
                where: { id: postOwnerId, deletedAt: (0, typeorm_2.IsNull)() },
            });
            if (!postOwner) {
                throw new common_1.NotFoundException('Post owner not found');
            }
            if (postOwner.blockedUsers?.includes(currentUserId)) {
                throw new common_1.ForbiddenException('You are blocked by this user');
            }
            const currentUser = await this.userRepository.findOne({
                where: { id: currentUserId, deletedAt: (0, typeorm_2.IsNull)() },
            });
            if (currentUser?.blockedUsers?.includes(postOwnerId)) {
                throw new common_1.ForbiddenException('You have blocked this user');
            }
            if (post.isHidden) {
                throw new common_1.NotFoundException('Post not found');
            }
            if (post.isPrivate) {
                const isFollowing = postOwner.followers?.includes(currentUserId) || false;
                if (!isFollowing) {
                    throw new common_1.ForbiddenException('This post is only visible to followers');
                }
                const isHiddenFrom = post.hiddenFromFollowers?.includes(currentUserId) || false;
                if (isHiddenFrom) {
                    throw new common_1.ForbiddenException('This post is not visible to you');
                }
            }
        }
        const likeIds = post.likes || [];
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
            where: { id: (0, typeorm_2.In)(pagedIds) },
            select: ['id', 'fullName', 'avatar'],
        });
        const idToUser = new Map(users.map((u) => [u.id, u]));
        const orderedUsers = pagedIds
            .map((id) => {
            const u = idToUser.get(id);
            if (!u)
                return null;
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
    async getFeed(userId, page = 1, limit = 20) {
        const cacheKey = `feed:${userId}:${page}:${limit}`;
        const cached = await this.redisService.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
        const user = await this.userRepository.findOne({
            where: { id: userId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const following = [...(user.following || []), userId];
        const blockedUsers = user.blockedUsers || [];
        const followingNotBlocked = following.filter((id) => !blockedUsers.includes(id));
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
        const filteredPosts = posts.filter((post) => {
            const postOwnerId = post.userId;
            if (postOwnerId === userId)
                return true;
            if (post.isPrivate) {
                const isFollowing = finalFollowing.includes(postOwnerId);
                const isHiddenFrom = post.hiddenFromFollowers?.includes(userId) || false;
                return isFollowing && !isHiddenFrom;
            }
            return true;
        });
        const authorIds = Array.from(new Set(filteredPosts.map((p) => p.userId)));
        let authorMap = new Map();
        if (authorIds.length > 0) {
            const authors = await this.userRepository.find({
                where: { id: (0, typeorm_2.In)(authorIds) },
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
        let activeAds = [];
        try {
            const now = new Date();
            activeAds = await this.adRepository
                .createQueryBuilder('ad')
                .where('ad.status = :status', { status: ad_entity_1.AdStatus.ACTIVE })
                .andWhere('ad.startDate <= :now AND ad.endDate >= :now', { now })
                .andWhere('(ad.maxImpressions = 0 OR ad.impressionCount < ad.maxImpressions)')
                .getMany();
        }
        catch (error) {
            console.error('Error fetching ads:', error);
        }
        const AD_INTERVAL = 5;
        const result = [];
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
    async invalidateFeedCache(userId) {
        try {
            const keys = await this.redisService.keys(`feed:${userId}:*`);
            if (keys.length > 0) {
                await this.redisService.mdel(keys);
            }
        }
        catch (error) {
            console.error('Error invalidating feed cache:', error);
        }
    }
    async getUserPosts(userId, currentUserId, page = 1, limit = 20) {
        if (!(0, id_util_1.isValidId)(userId)) {
            throw new common_1.BadRequestException('Invalid user ID format');
        }
        if (currentUserId && currentUserId !== userId) {
            const postOwner = await this.userRepository.findOne({
                where: { id: userId, deletedAt: (0, typeorm_2.IsNull)() },
            });
            if (!postOwner) {
                throw new common_1.NotFoundException('User not found');
            }
            if (postOwner.blockedUsers?.includes(currentUserId)) {
                throw new common_1.ForbiddenException('You are blocked by this user');
            }
            const currentUser = await this.userRepository.findOne({
                where: { id: currentUserId, deletedAt: (0, typeorm_2.IsNull)() },
            });
            if (currentUser?.blockedUsers?.includes(userId)) {
                throw new common_1.ForbiddenException('You have blocked this user');
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
                where: { id: userId, deletedAt: (0, typeorm_2.IsNull)() },
            });
            const isFollowing = postOwner?.followers?.includes(currentUserId) || false;
            filteredPosts = posts.filter((post) => {
                if (post.isPrivate) {
                    if (!isFollowing)
                        return false;
                    const isHiddenFrom = post.hiddenFromFollowers?.includes(currentUserId) || false;
                    return !isHiddenFrom;
                }
                return true;
            });
        }
        let savedPosts = [];
        if (currentUserId) {
            const user = await this.userRepository.findOne({
                where: { id: currentUserId, deletedAt: (0, typeorm_2.IsNull)() },
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
    async getPostById(postId, currentUserId) {
        if (!(0, id_util_1.isValidId)(postId)) {
            throw new common_1.BadRequestException('Invalid post ID format');
        }
        const post = await this.postRepository.findOne({
            where: { id: postId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!post) {
            throw new common_1.NotFoundException('Post not found');
        }
        const postOwnerId = post.userId;
        if (currentUserId !== postOwnerId) {
            const postOwner = await this.userRepository.findOne({
                where: { id: postOwnerId, deletedAt: (0, typeorm_2.IsNull)() },
            });
            if (!postOwner) {
                throw new common_1.NotFoundException('Post owner not found');
            }
            if (postOwner.blockedUsers?.includes(currentUserId)) {
                throw new common_1.ForbiddenException('You are blocked by this user');
            }
            const currentUser = await this.userRepository.findOne({
                where: { id: currentUserId, deletedAt: (0, typeorm_2.IsNull)() },
            });
            if (currentUser?.blockedUsers?.includes(postOwnerId)) {
                throw new common_1.ForbiddenException('You have blocked this user');
            }
            if (post.isHidden) {
                throw new common_1.NotFoundException('Post not found');
            }
            if (post.isPrivate) {
                const isFollowing = postOwner.followers?.includes(currentUserId) || false;
                if (!isFollowing) {
                    throw new common_1.ForbiddenException('This post is only visible to followers');
                }
                const isHiddenFrom = post.hiddenFromFollowers?.includes(currentUserId) || false;
                if (isHiddenFrom) {
                    throw new common_1.ForbiddenException('This post is not visible to you');
                }
            }
        }
        const currentUser = await this.userRepository.findOne({
            where: { id: currentUserId, deletedAt: (0, typeorm_2.IsNull)() },
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
    async like(postId, userId) {
        const post = await this.postRepository.findOne({
            where: { id: postId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!post)
            throw new common_1.NotFoundException('Post not found');
        const postOwner = await this.userRepository.findOne({
            where: { id: post.userId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (postOwner?.blockedUsers?.includes(userId)) {
            throw new common_1.ForbiddenException('You are blocked by this user');
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
                }
                else {
                    await this.redisService.set(cacheKey, '1', 60);
                }
            }
            return { message: 'Liked' };
        }
        return { message: 'Already liked' };
    }
    async unlike(postId, userId) {
        const post = await this.postRepository.findOne({
            where: { id: postId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!post)
            throw new common_1.NotFoundException('Post not found');
        const isLiked = post.likes?.includes(userId) || false;
        if (isLiked) {
            post.likes = (post.likes || []).filter((id) => id !== userId);
            await this.postRepository.save(post);
            return { message: 'Unliked' };
        }
        return { message: 'Already unliked' };
    }
    async getComments(postId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const maxLimit = Math.min(limit, 50);
        const comments = await this.commentRepository.find({
            where: { postId, deletedAt: (0, typeorm_2.IsNull)() },
            order: { createdAt: 'DESC' },
            skip,
            take: maxLimit,
        });
        const userIds = Array.from(new Set(comments.map((c) => c.userId)));
        let userMap = new Map();
        if (userIds.length > 0) {
            const users = await this.userRepository.find({
                where: { id: (0, typeorm_2.In)(userIds) },
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
    async addComment(postId, userId, text) {
        const post = await this.postRepository.findOne({
            where: { id: postId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!post)
            throw new common_1.NotFoundException('Post not found');
        const postOwner = await this.userRepository.findOne({
            where: { id: post.userId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (postOwner?.blockedUsers?.includes(userId)) {
            throw new common_1.ForbiddenException('You are blocked by this user');
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
            }
            else {
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
    async savePost(postId, userId) {
        const post = await this.postRepository.findOne({
            where: { id: postId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!post)
            throw new common_1.NotFoundException('Post not found');
        const user = await this.userRepository.findOne({
            where: { id: userId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (!user.savedPosts?.includes(postId)) {
            user.savedPosts = [...(user.savedPosts || []), postId];
            await this.userRepository.save(user);
        }
        return { message: 'Post saved' };
    }
    async unsavePost(postId, userId) {
        const user = await this.userRepository.findOne({
            where: { id: userId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        user.savedPosts = (user.savedPosts || []).filter((id) => id !== postId);
        await this.userRepository.save(user);
        return { message: 'Post unsaved' };
    }
    async getSavedPosts(userId, page = 1, limit = 20) {
        const user = await this.userRepository.findOne({
            where: { id: userId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
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
            where: { id: (0, typeorm_2.In)(savedPostIds), deletedAt: (0, typeorm_2.IsNull)() },
            order: { createdAt: 'DESC' },
            skip,
            take: maxLimit,
        });
        const blockedUsers = user.blockedUsers || [];
        let filteredPosts = posts.filter((p) => !blockedUsers.includes(p.userId));
        const postOwnerIds = Array.from(new Set(filteredPosts.map((p) => p.userId)));
        let authorMap = new Map();
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
                where: { id: (0, typeorm_2.In)(postOwnerIds) },
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
    async hidePost(postId, userId) {
        const post = await this.postRepository.findOne({
            where: { id: postId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!post)
            throw new common_1.NotFoundException('Post not found');
        if (post.userId !== userId) {
            throw new common_1.ForbiddenException('You can only hide your own posts');
        }
        post.isHidden = true;
        await this.postRepository.save(post);
        return { message: 'Post hidden successfully' };
    }
    async unhidePost(postId, userId) {
        const post = await this.postRepository.findOne({
            where: { id: postId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!post)
            throw new common_1.NotFoundException('Post not found');
        if (post.userId !== userId) {
            throw new common_1.ForbiddenException('You can only unhide your own posts');
        }
        post.isHidden = false;
        await this.postRepository.save(post);
        return { message: 'Post unhidden successfully' };
    }
    async deletePost(postId, userId) {
        const post = await this.postRepository.findOne({
            where: { id: postId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!post)
            throw new common_1.NotFoundException('Post not found');
        if (post.userId !== userId) {
            throw new common_1.ForbiddenException('You can only delete your own posts');
        }
        const deletedAt = new Date();
        await this.commentRepository.update({ postId, deletedAt: (0, typeorm_2.IsNull)() }, { deletedAt });
        await this.notificationRepository.update({ postId, deletedAt: (0, typeorm_2.IsNull)() }, { deletedAt });
        post.deletedAt = deletedAt;
        await this.postRepository.save(post);
        await this.invalidateFeedCache(userId);
        return { message: 'Post deleted successfully' };
    }
    async updateVisibility(postId, userId, payload) {
        const post = await this.postRepository.findOne({
            where: { id: postId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!post)
            throw new common_1.NotFoundException('Post not found');
        if (post.userId !== userId) {
            throw new common_1.ForbiddenException('You can only update your own posts');
        }
        if (typeof payload.isPrivate === 'boolean')
            post.isPrivate = payload.isPrivate;
        if (typeof payload.isHidden === 'boolean')
            post.isHidden = payload.isHidden;
        if (Array.isArray(payload.hiddenFromFollowers))
            post.hiddenFromFollowers = payload.hiddenFromFollowers;
        await this.postRepository.save(post);
        return { message: 'Visibility updated', update: payload };
    }
    async sharePost(postId, userId, receiverId) {
        const post = await this.postRepository.findOne({
            where: { id: postId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!post)
            throw new common_1.NotFoundException('Post not found');
        return {
            postId: post.id,
            image: post.image,
            caption: post.caption,
        };
    }
};
exports.PostsService = PostsService;
exports.PostsService = PostsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(post_entity_1.Post)),
    __param(1, (0, typeorm_1.InjectRepository)(comment_entity_1.Comment)),
    __param(2, (0, typeorm_1.InjectRepository)(notification_entity_1.Notification)),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(4, (0, typeorm_1.InjectRepository)(ad_entity_1.Ad)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        redis_service_1.RedisService])
], PostsService);
//# sourceMappingURL=posts.service.js.map