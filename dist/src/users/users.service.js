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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../entities/user.entity");
const user_credentials_entity_1 = require("../entities/user-credentials.entity");
const post_entity_1 = require("../entities/post.entity");
const comment_entity_1 = require("../entities/comment.entity");
const conversation_entity_1 = require("../entities/conversation.entity");
const message_entity_1 = require("../entities/message.entity");
const notification_entity_1 = require("../entities/notification.entity");
const redis_service_1 = require("../common/redis/redis.service");
let UsersService = class UsersService {
    userRepository;
    credentialsRepository;
    postRepository;
    commentRepository;
    conversationRepository;
    messageRepository;
    notificationRepository;
    redisService;
    constructor(userRepository, credentialsRepository, postRepository, commentRepository, conversationRepository, messageRepository, notificationRepository, redisService) {
        this.userRepository = userRepository;
        this.credentialsRepository = credentialsRepository;
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.notificationRepository = notificationRepository;
        this.redisService = redisService;
    }
    async findById(userId, currentUserId) {
        const cacheKey = `user:${userId}`;
        if (!currentUserId || currentUserId === userId) {
            const cached = await this.redisService.get(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
        }
        const user = await this.userRepository.findOne({
            where: { id: userId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (currentUserId && user.blockedUsers?.includes(currentUserId)) {
            throw new common_1.ForbiddenException('You are blocked by this user');
        }
        const userObj = user.toObject ? user.toObject() : { ...user };
        const followerCount = userObj.followers?.length || 0;
        const followingCount = userObj.following?.length || 0;
        let result;
        if (currentUserId && currentUserId !== userId) {
            const currentUser = await this.userRepository.findOne({
                where: { id: currentUserId, deletedAt: (0, typeorm_2.IsNull)() },
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
        }
        else {
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
    async search(query) {
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
        }
        catch (error) {
            console.error('Search error:', error);
            return [];
        }
    }
    async follow(userId, currentUserId) {
        if (userId === currentUserId) {
            throw new common_1.BadRequestException('Cannot follow yourself');
        }
        const user = await this.userRepository.findOne({
            where: { id: userId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const currentUser = await this.userRepository.findOne({
            where: { id: currentUserId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!currentUser)
            throw new common_1.NotFoundException('Current user not found');
        if (user.blockedUsers?.includes(currentUserId)) {
            throw new common_1.ForbiddenException('You are blocked by this user');
        }
        if (currentUser.blockedUsers?.includes(userId)) {
            throw new common_1.ForbiddenException('You have blocked this user');
        }
        if (currentUser.following?.includes(userId)) {
            throw new common_1.BadRequestException('Already following');
        }
        currentUser.following = [...(currentUser.following || []), userId];
        user.followers = [...(user.followers || []), currentUserId];
        await this.userRepository.save(currentUser);
        await this.userRepository.save(user);
        await this.invalidateFeedCache(currentUserId);
        return { message: 'Followed successfully' };
    }
    async unfollow(userId, currentUserId) {
        const currentUser = await this.userRepository.findOne({
            where: { id: currentUserId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        const user = await this.userRepository.findOne({
            where: { id: userId, deletedAt: (0, typeorm_2.IsNull)() },
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
    async block(userId, currentUserId) {
        if (userId === currentUserId) {
            throw new common_1.BadRequestException('Cannot block yourself');
        }
        const currentUser = await this.userRepository.findOne({
            where: { id: currentUserId, deletedAt: (0, typeorm_2.IsNull)() },
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
    async unblock(userId, currentUserId) {
        const currentUser = await this.userRepository.findOne({
            where: { id: currentUserId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (currentUser) {
            currentUser.blockedUsers = (currentUser.blockedUsers || []).filter((id) => id !== userId);
            await this.userRepository.save(currentUser);
        }
        return { message: 'Unblocked successfully' };
    }
    async updateProfile(userId, data) {
        await this.userRepository.update({ id: userId, deletedAt: (0, typeorm_2.IsNull)() }, data);
        const updatedUser = await this.userRepository.findOne({
            where: { id: userId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!updatedUser)
            throw new common_1.NotFoundException('User not found');
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
    async getBlockedUsers(userId) {
        const user = await this.userRepository.findOne({
            where: { id: userId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const blockedIds = user.blockedUsers || [];
        if (blockedIds.length === 0)
            return [];
        return this.userRepository.find({
            where: { id: (0, typeorm_2.In)(blockedIds), deletedAt: (0, typeorm_2.IsNull)() },
            select: ['id', 'fullName', 'avatar'],
        });
    }
    async getFollowers(userId, currentUserId) {
        const user = await this.userRepository.findOne({
            where: { id: userId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (currentUserId && user.blockedUsers?.includes(currentUserId)) {
            throw new common_1.ForbiddenException('You are blocked by this user');
        }
        const isOwnProfile = currentUserId && currentUserId === userId;
        if (!isOwnProfile && user.hideFollowers) {
            throw new common_1.ForbiddenException('Followers list is hidden');
        }
        const followerIds = user.followers || [];
        if (followerIds.length === 0)
            return [];
        let visibleFollowerIds = followerIds;
        if (!isOwnProfile && user.hiddenFollowers && user.hiddenFollowers.length > 0) {
            visibleFollowerIds = followerIds.filter((id) => !user.hiddenFollowers.includes(id));
        }
        if (visibleFollowerIds.length === 0)
            return [];
        const followers = await this.userRepository.find({
            where: { id: (0, typeorm_2.In)(visibleFollowerIds), deletedAt: (0, typeorm_2.IsNull)() },
            select: ['id', 'fullName', 'avatar'],
        });
        let currentUserFollowing = [];
        if (currentUserId) {
            const currentUser = await this.userRepository.findOne({
                where: { id: currentUserId, deletedAt: (0, typeorm_2.IsNull)() },
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
    async getFollowing(userId, currentUserId) {
        const user = await this.userRepository.findOne({
            where: { id: userId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (currentUserId && user.blockedUsers?.includes(currentUserId)) {
            throw new common_1.ForbiddenException('You are blocked by this user');
        }
        const isOwnProfile = currentUserId && currentUserId === userId;
        if (!isOwnProfile && user.hideFollowing) {
            throw new common_1.ForbiddenException('Following list is hidden');
        }
        const followingIds = user.following || [];
        if (followingIds.length === 0)
            return [];
        let visibleFollowingIds = followingIds;
        if (!isOwnProfile && user.hiddenFollowing && user.hiddenFollowing.length > 0) {
            visibleFollowingIds = followingIds.filter((id) => !user.hiddenFollowing.includes(id));
        }
        if (visibleFollowingIds.length === 0)
            return [];
        const following = await this.userRepository.find({
            where: { id: (0, typeorm_2.In)(visibleFollowingIds), deletedAt: (0, typeorm_2.IsNull)() },
            select: ['id', 'fullName', 'avatar'],
        });
        let currentUserFollowing = [];
        if (currentUserId) {
            const currentUser = await this.userRepository.findOne({
                where: { id: currentUserId, deletedAt: (0, typeorm_2.IsNull)() },
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
    async deleteAccount(userId) {
        const user = await this.userRepository.findOne({
            where: { id: userId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const deletedAt = new Date();
        const userPosts = await this.postRepository.find({
            where: { userId, deletedAt: (0, typeorm_2.IsNull)() },
            select: ['id'],
        });
        const postIds = userPosts.map((p) => p.id);
        if (postIds.length > 0) {
            await this.commentRepository
                .createQueryBuilder()
                .update(comment_entity_1.Comment)
                .set({ deletedAt })
                .where('postId IN (:...postIds)', { postIds })
                .andWhere('deletedAt IS NULL')
                .execute();
            await this.notificationRepository
                .createQueryBuilder()
                .update(notification_entity_1.Notification)
                .set({ deletedAt })
                .where('postId IN (:...postIds)', { postIds })
                .andWhere('deletedAt IS NULL')
                .execute();
            await this.postRepository
                .createQueryBuilder()
                .update(post_entity_1.Post)
                .set({ deletedAt })
                .where('userId = :userId', { userId })
                .andWhere('deletedAt IS NULL')
                .execute();
        }
        await this.commentRepository
            .createQueryBuilder()
            .update(comment_entity_1.Comment)
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
                .update(message_entity_1.Message)
                .set({ deletedAt })
                .where('conversationId = :convId', { convId: conv.id })
                .andWhere('deletedAt IS NULL')
                .execute();
            const otherParticipants = conv.participants.filter((p) => p !== userId);
            if (otherParticipants.length === 0) {
                conv.deletedAt = deletedAt;
            }
            else {
                conv.participants = otherParticipants;
            }
            await this.conversationRepository.save(conv);
        }
        await this.notificationRepository
            .createQueryBuilder()
            .update(notification_entity_1.Notification)
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
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(user_credentials_entity_1.UserCredentials)),
    __param(2, (0, typeorm_1.InjectRepository)(post_entity_1.Post)),
    __param(3, (0, typeorm_1.InjectRepository)(comment_entity_1.Comment)),
    __param(4, (0, typeorm_1.InjectRepository)(conversation_entity_1.Conversation)),
    __param(5, (0, typeorm_1.InjectRepository)(message_entity_1.Message)),
    __param(6, (0, typeorm_1.InjectRepository)(notification_entity_1.Notification)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        redis_service_1.RedisService])
], UsersService);
//# sourceMappingURL=users.service.js.map