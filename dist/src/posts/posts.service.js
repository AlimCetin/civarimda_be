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
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const mongoose_3 = require("mongoose");
const post_entity_1 = require("../entities/post.entity");
const comment_entity_1 = require("../entities/comment.entity");
const notification_entity_1 = require("../entities/notification.entity");
const user_entity_1 = require("../entities/user.entity");
const ad_entity_1 = require("../entities/ad.entity");
const redis_service_1 = require("../common/redis/redis.service");
let PostsService = class PostsService {
    postModel;
    commentModel;
    notificationModel;
    userModel;
    adModel;
    redisService;
    constructor(postModel, commentModel, notificationModel, userModel, adModel, redisService) {
        this.postModel = postModel;
        this.commentModel = commentModel;
        this.notificationModel = notificationModel;
        this.userModel = userModel;
        this.adModel = adModel;
        this.redisService = redisService;
    }
    async create(userId, image, caption, isPrivate = false, hiddenFromFollowers = [], video) {
        if (!image && !video) {
            throw new common_1.BadRequestException('Either image or video is required');
        }
        const post = await this.postModel.create({
            userId,
            image: image || undefined,
            video: video || undefined,
            caption,
            isPrivate: isPrivate || false,
            hiddenFromFollowers: hiddenFromFollowers || [],
        });
        await this.invalidateFeedCache(userId);
        return post;
    }
    async getLikes(postId, currentUserId, page = 1, limit = 20) {
        if (!mongoose_3.Types.ObjectId.isValid(postId)) {
            throw new common_1.BadRequestException('Invalid post ID format');
        }
        const post = await this.postModel.findOne({ _id: postId, deletedAt: null }).select('userId likes isHidden isPrivate hiddenFromFollowers').lean();
        if (!post) {
            throw new common_1.NotFoundException('Post not found');
        }
        const postOwnerId = post.userId?.toString ? post.userId.toString() : String(post.userId);
        if (currentUserId !== postOwnerId) {
            const postOwner = await this.userModel.findOne({ _id: postOwnerId, deletedAt: null }).select('blockedUsers followers').lean();
            if (!postOwner) {
                throw new common_1.NotFoundException('Post owner not found');
            }
            if (postOwner.blockedUsers?.includes(currentUserId)) {
                throw new common_1.ForbiddenException('You are blocked by this user');
            }
            const currentUser = await this.userModel.findOne({ _id: currentUserId, deletedAt: null }).select('blockedUsers').lean();
            if (currentUser?.blockedUsers?.includes(postOwnerId)) {
                throw new common_1.ForbiddenException('You have blocked this user');
            }
            if (post.isHidden) {
                throw new common_1.NotFoundException('Post not found');
            }
            if (post.isPrivate) {
                const isFollowing = postOwner.followers?.some((id) => id.toString() === currentUserId) || false;
                if (!isFollowing) {
                    throw new common_1.ForbiddenException('This post is only visible to followers');
                }
                const isHiddenFrom = post.hiddenFromFollowers?.some((id) => id.toString() === currentUserId) || false;
                if (isHiddenFrom) {
                    throw new common_1.ForbiddenException('This post is not visible to you');
                }
            }
        }
        const likeIds = (post.likes || []).map((id) => id.toString());
        const skip = (page - 1) * limit;
        const maxLimit = Math.min(limit, 50);
        const pagedIds = likeIds.slice(skip, skip + maxLimit);
        const users = await this.userModel
            .find({ _id: { $in: pagedIds } })
            .select('fullName avatar')
            .lean();
        const idToUser = {};
        for (const u of users) {
            idToUser[u._id.toString()] = u;
        }
        const orderedUsers = pagedIds
            .map((id) => {
            const u = idToUser[id];
            if (!u)
                return null;
            return {
                id,
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
        const user = await this.userModel.findOne({ _id: userId, deletedAt: null }).select('following blockedUsers savedPosts role');
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const following = [...user.following, userId];
        const blockedUsers = user.blockedUsers || [];
        const followingNotBlocked = following.filter(id => !blockedUsers.includes(id));
        const usersWhoBlockedMe = await this.userModel.find({
            _id: { $in: following },
            blockedUsers: userId,
            deletedAt: null,
        }).select('_id').lean();
        const blockedByUserIds = usersWhoBlockedMe.map(u => u._id.toString());
        const finalFollowing = followingNotBlocked.filter(id => !blockedByUserIds.includes(id));
        const skip = (page - 1) * limit;
        const maxLimit = Math.min(limit, 50);
        const posts = await this.postModel.find({
            userId: { $in: finalFollowing },
            deletedAt: null,
            $or: [
                { isHidden: false },
                { isHidden: { $exists: false } },
                { userId: userId }
            ]
        })
            .populate('userId', 'fullName avatar')
            .select('userId image video caption likes commentCount createdAt isHidden isPrivate hiddenFromFollowers')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(maxLimit)
            .lean();
        const savedPosts = user.savedPosts?.map((id) => id.toString()) || [];
        const filteredPosts = posts.filter((post) => {
            const postOwnerId = (post.userId?._id || post.userId)?.toString();
            if (postOwnerId === userId)
                return true;
            if (post.isPrivate) {
                const isFollowing = finalFollowing.includes(postOwnerId);
                const isHiddenFrom = post.hiddenFromFollowers?.some((id) => id.toString() === userId) || false;
                return isFollowing && !isHiddenFrom;
            }
            return true;
        });
        const formattedPosts = filteredPosts.map((post) => {
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
                video: post.video || undefined,
                caption: post.caption || '',
                likeCount: post.likes?.length || 0,
                commentCount: post.commentCount || 0,
                isLiked: post.likes?.some((id) => id.toString() === userId) || false,
                isSaved: savedPosts.includes(post._id.toString()),
                createdAt: post.createdAt,
            };
        });
        let activeAds = [];
        try {
            const now = new Date();
            activeAds = await this.adModel.find({
                status: ad_entity_1.AdStatus.ACTIVE,
                startDate: { $lte: now },
                endDate: { $gte: now },
                $or: [
                    { maxImpressions: 0 },
                    { $expr: { $lt: ['$impressionCount', '$maxImpressions'] } },
                ],
            }).lean();
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
                    id: ad._id.toString(),
                    type: 'ad',
                    title: ad.title,
                    description: ad.description,
                    mediaUrl: ad.mediaUrl,
                    linkUrl: ad.linkUrl,
                    adType: ad.type,
                    createdAt: ad.createdAt,
                });
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
        if (!mongoose_3.Types.ObjectId.isValid(userId)) {
            throw new common_1.BadRequestException('Invalid user ID format');
        }
        if (currentUserId && currentUserId !== userId) {
            const postOwner = await this.userModel.findOne({ _id: userId, deletedAt: null }).select('blockedUsers').lean();
            if (!postOwner) {
                throw new common_1.NotFoundException('User not found');
            }
            if (postOwner.blockedUsers?.includes(currentUserId)) {
                throw new common_1.ForbiddenException('You are blocked by this user');
            }
            const currentUser = await this.userModel.findOne({ _id: currentUserId, deletedAt: null }).select('blockedUsers savedPosts').lean();
            if (currentUser?.blockedUsers?.includes(userId)) {
                throw new common_1.ForbiddenException('You have blocked this user');
            }
        }
        const skip = (page - 1) * limit;
        const maxLimit = Math.min(limit, 50);
        const query = { userId, deletedAt: null };
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
        let filteredPosts = posts;
        if (currentUserId && currentUserId !== userId) {
            const postOwner = await this.userModel.findOne({ _id: userId, deletedAt: null }).select('followers').lean();
            if (!postOwner) {
                throw new common_1.NotFoundException('User not found');
            }
            const isFollowing = postOwner?.followers?.some((id) => id.toString() === currentUserId) || false;
            filteredPosts = posts.filter((post) => {
                if (post.isPrivate) {
                    if (!isFollowing) {
                        return false;
                    }
                    const hiddenFromFollowers = post.hiddenFromFollowers || [];
                    const isHiddenFrom = hiddenFromFollowers.some((id) => {
                        const hiddenId = id?.toString ? id.toString() : String(id);
                        const currentId = currentUserId.toString();
                        return hiddenId === currentId;
                    });
                    return !isHiddenFrom;
                }
                return true;
            });
        }
        let savedPosts = [];
        if (currentUserId) {
            const user = await this.userModel.findOne({ _id: currentUserId, deletedAt: null }).select('savedPosts').lean();
            savedPosts = user?.savedPosts?.map((id) => id.toString()) || [];
        }
        return {
            posts: filteredPosts.map((post) => {
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
                    video: post.video || undefined,
                    caption: post.caption || '',
                    likeCount: post.likes?.length || 0,
                    commentCount: post.commentCount || 0,
                    isLiked: currentUserId ? post.likes?.some((id) => id.toString() === currentUserId) || false : false,
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
    async getPostById(postId, currentUserId) {
        if (!mongoose_3.Types.ObjectId.isValid(postId)) {
            throw new common_1.BadRequestException('Invalid post ID format');
        }
        const post = await this.postModel.findOne({ _id: postId, deletedAt: null })
            .populate('userId', 'fullName avatar')
            .select('userId image video caption likes commentCount createdAt isHidden isPrivate hiddenFromFollowers')
            .lean();
        if (!post) {
            throw new common_1.NotFoundException('Post not found');
        }
        const postOwnerId = post.userId?._id?.toString() || post.userId?.toString() || post.userId?.toString();
        if (currentUserId !== postOwnerId) {
            const postOwner = await this.userModel.findById(postOwnerId).select('blockedUsers').lean();
            if (!postOwner) {
                throw new common_1.NotFoundException('Post owner not found');
            }
            if (postOwner.blockedUsers?.includes(currentUserId)) {
                throw new common_1.ForbiddenException('You are blocked by this user');
            }
            const currentUser = await this.userModel.findOne({ _id: currentUserId, deletedAt: null }).select('blockedUsers savedPosts').lean();
            if (currentUser?.blockedUsers?.includes(postOwnerId)) {
                throw new common_1.ForbiddenException('You have blocked this user');
            }
            if (post.isHidden) {
                throw new common_1.NotFoundException('Post not found');
            }
            if (post.isPrivate) {
                const postOwnerWithFollowers = await this.userModel.findOne({ _id: postOwnerId, deletedAt: null }).select('followers').lean();
                const isFollowing = postOwnerWithFollowers?.followers?.some((id) => id.toString() === currentUserId) || false;
                if (!isFollowing) {
                    throw new common_1.ForbiddenException('This post is only visible to followers');
                }
                const hiddenFromFollowers = post.hiddenFromFollowers || [];
                const isHiddenFrom = hiddenFromFollowers.some((id) => {
                    const hiddenId = id?.toString ? id.toString() : String(id);
                    const currentId = currentUserId.toString();
                    return hiddenId === currentId;
                });
                if (isHiddenFrom) {
                    throw new common_1.ForbiddenException('This post is not visible to you');
                }
            }
        }
        const currentUser = await this.userModel.findById(currentUserId).select('savedPosts').lean();
        const savedPosts = currentUser?.savedPosts?.map((id) => id.toString()) || [];
        const populatedUserId = post.userId?._id || post.userId;
        const userDataRaw = post.userId?._id
            ? post.userId
            : { _id: populatedUserId, fullName: '', avatar: null };
        const userData = userDataRaw;
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
            video: post.video || undefined,
            caption: post.caption || '',
            likeCount: post.likes?.length || 0,
            commentCount: post.commentCount || 0,
            isLiked: post.likes?.some((id) => id.toString() === currentUserId) || false,
            isSaved: savedPosts.includes(post._id.toString()),
            isHidden: post.isHidden || false,
            isPrivate: post.isPrivate || false,
            hiddenFromFollowers: (post.hiddenFromFollowers || []).map((id) => id.toString()),
            createdAt: post.createdAt,
        };
    }
    async like(postId, userId) {
        const post = await this.postModel.findOne({ _id: postId, deletedAt: null }).populate('userId');
        if (!post)
            throw new common_1.NotFoundException('Post not found');
        const postOwner = post.userId;
        if (postOwner.blockedUsers?.includes(userId)) {
            throw new common_1.ForbiddenException('You are blocked by this user');
        }
        const isLiked = post.likes.some((id) => id.toString() === userId);
        if (!isLiked) {
            await this.postModel.updateOne({ _id: postId }, { $addToSet: { likes: userId } });
            const postOwnerId = post.userId?._id
                ? post.userId._id.toString()
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
                const cacheKey = `notification:unread:${postOwnerId}`;
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
        const post = await this.postModel.findOne({ _id: postId, deletedAt: null });
        if (!post)
            throw new common_1.NotFoundException('Post not found');
        const isLiked = post.likes.some((id) => id.toString() === userId);
        if (isLiked) {
            await this.postModel.updateOne({ _id: postId }, { $pull: { likes: userId } });
            return { message: 'Unliked' };
        }
        return { message: 'Already unliked' };
    }
    async getComments(postId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const maxLimit = Math.min(limit, 50);
        const comments = await this.commentModel.find({ postId, deletedAt: null })
            .populate('userId', 'fullName avatar')
            .select('userId text createdAt')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(maxLimit)
            .lean();
        return {
            comments: comments.map((comment) => {
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
    async addComment(postId, userId, text) {
        const post = await this.postModel.findOne({ _id: postId, deletedAt: null }).populate('userId');
        if (!post)
            throw new common_1.NotFoundException('Post not found');
        const postOwner = post.userId;
        if (postOwner.blockedUsers?.includes(userId)) {
            throw new common_1.ForbiddenException('You are blocked by this user');
        }
        const comment = await this.commentModel.create({ postId, userId, text });
        await this.postModel.updateOne({ _id: postId }, { $inc: { commentCount: 1 } });
        const postOwnerId = post.userId?._id
            ? post.userId._id.toString()
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
            const cacheKey = `notification:unread:${postOwnerId}`;
            const cached = await this.redisService.get(cacheKey);
            if (cached !== null) {
                await this.redisService.incr(cacheKey);
                await this.redisService.expire(cacheKey, 60);
            }
            else {
                await this.redisService.set(cacheKey, '1', 60);
            }
        }
        const populatedComment = await comment.populate('userId', 'fullName avatar');
        const populatedUserId = populatedComment.userId._id || populatedComment.userId;
        const userData = typeof populatedComment.userId === 'object' && populatedComment.userId._id
            ? populatedComment.userId
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
            createdAt: populatedComment.createdAt,
        };
    }
    async savePost(postId, userId) {
        const post = await this.postModel.findOne({ _id: postId, deletedAt: null });
        if (!post)
            throw new common_1.NotFoundException('Post not found');
        await this.userModel.updateOne({ _id: userId }, { $addToSet: { savedPosts: postId } });
        return { message: 'Post saved' };
    }
    async unsavePost(postId, userId) {
        const post = await this.postModel.findOne({ _id: postId, deletedAt: null });
        if (!post)
            throw new common_1.NotFoundException('Post not found');
        await this.userModel.updateOne({ _id: userId }, { $pull: { savedPosts: postId } });
        return { message: 'Post unsaved' };
    }
    async getSavedPosts(userId, page = 1, limit = 20) {
        const user = await this.userModel.findOne({ _id: userId, deletedAt: null }).select('savedPosts blockedUsers').lean();
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const savedPostIds = user.savedPosts?.map((id) => id.toString()) || [];
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
        const blockedUsers = user.blockedUsers?.map((id) => id.toString()) || [];
        let filteredPosts = posts.filter((post) => {
            const postOwnerId = post.userId?._id?.toString() || post.userId?.toString();
            return !blockedUsers.includes(postOwnerId);
        });
        const postOwnerIds = filteredPosts.map((post) => {
            return post.userId?._id?.toString() || post.userId?.toString();
        }).filter(Boolean);
        if (postOwnerIds.length > 0) {
            const usersWhoBlockedMe = await this.userModel.find({
                _id: { $in: postOwnerIds },
                blockedUsers: userId,
                deletedAt: null,
            }).select('_id').lean();
            const blockedByUserIds = usersWhoBlockedMe.map((u) => u._id.toString());
            filteredPosts = filteredPosts.filter((post) => {
                const postOwnerId = post.userId?._id?.toString() || post.userId?.toString();
                return !blockedByUserIds.includes(postOwnerId);
            });
        }
        const formattedPosts = filteredPosts.map((post) => {
            const populatedUserId = post.userId?._id || post.userId;
            const userData = post.userId;
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
                isLiked: post.likes?.some((id) => id.toString() === userId) || false,
                isSaved: true,
                isHidden: post.isHidden || false,
                isPrivate: post.isPrivate || false,
                hiddenFromFollowers: (post.hiddenFromFollowers || []).map((id) => id.toString()),
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
        const post = await this.postModel.findOne({ _id: postId, deletedAt: null });
        if (!post)
            throw new common_1.NotFoundException('Post not found');
        if (post.userId.toString() !== userId) {
            throw new common_1.ForbiddenException('You can only hide your own posts');
        }
        post.isHidden = true;
        await post.save();
        return { message: 'Post hidden successfully' };
    }
    async unhidePost(postId, userId) {
        const post = await this.postModel.findOne({ _id: postId, deletedAt: null });
        if (!post)
            throw new common_1.NotFoundException('Post not found');
        if (post.userId.toString() !== userId) {
            throw new common_1.ForbiddenException('You can only unhide your own posts');
        }
        post.isHidden = false;
        await post.save();
        return { message: 'Post unhidden successfully' };
    }
    async deletePost(postId, userId) {
        const post = await this.postModel.findOne({ _id: postId, deletedAt: null });
        if (!post)
            throw new common_1.NotFoundException('Post not found');
        if (post.userId.toString() !== userId) {
            throw new common_1.ForbiddenException('You can only delete your own posts');
        }
        await this.commentModel.updateMany({ postId, deletedAt: null }, { $set: { deletedAt: new Date() } });
        await this.notificationModel.updateMany({ postId, deletedAt: null }, { $set: { deletedAt: new Date() } });
        await this.userModel.updateMany({ savedPosts: postId }, { $pull: { savedPosts: postId } });
        await this.postModel.updateOne({ _id: postId }, { $set: { deletedAt: new Date() } });
        await this.invalidateFeedCache(userId);
        return { message: 'Post deleted successfully' };
    }
    async updateVisibility(postId, userId, payload) {
        console.log('📥 Backend updateVisibility called:', {
            postId,
            userId,
            payload,
        });
        const post = await this.postModel.findOne({ _id: postId, deletedAt: null });
        if (!post)
            throw new common_1.NotFoundException('Post not found');
        if (post.userId.toString() !== userId) {
            throw new common_1.ForbiddenException('You can only update your own posts');
        }
        const update = {};
        if (typeof payload.isPrivate === 'boolean')
            update.isPrivate = payload.isPrivate;
        if (typeof payload.isHidden === 'boolean')
            update.isHidden = payload.isHidden;
        if (Array.isArray(payload.hiddenFromFollowers))
            update.hiddenFromFollowers = payload.hiddenFromFollowers;
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
    async sharePost(postId, userId, receiverId) {
        const post = await this.postModel.findOne({ _id: postId, deletedAt: null });
        if (!post)
            throw new common_1.NotFoundException('Post not found');
        return {
            postId: post._id.toString(),
            image: post.image,
            caption: post.caption,
        };
    }
};
exports.PostsService = PostsService;
exports.PostsService = PostsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(post_entity_1.Post.name)),
    __param(1, (0, mongoose_1.InjectModel)(comment_entity_1.Comment.name)),
    __param(2, (0, mongoose_1.InjectModel)(notification_entity_1.Notification.name)),
    __param(3, (0, mongoose_1.InjectModel)(user_entity_1.User.name)),
    __param(4, (0, mongoose_1.InjectModel)(ad_entity_1.Ad.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        redis_service_1.RedisService])
], PostsService);
//# sourceMappingURL=posts.service.js.map