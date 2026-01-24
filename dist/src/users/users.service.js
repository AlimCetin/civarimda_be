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
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_entity_1 = require("../entities/user.entity");
const user_credentials_entity_1 = require("../entities/user-credentials.entity");
const post_entity_1 = require("../entities/post.entity");
const comment_entity_1 = require("../entities/comment.entity");
const conversation_entity_1 = require("../entities/conversation.entity");
const message_entity_1 = require("../entities/message.entity");
const notification_entity_1 = require("../entities/notification.entity");
const redis_service_1 = require("../common/redis/redis.service");
let UsersService = class UsersService {
    userModel;
    credentialsModel;
    postModel;
    commentModel;
    conversationModel;
    messageModel;
    notificationModel;
    redisService;
    constructor(userModel, credentialsModel, postModel, commentModel, conversationModel, messageModel, notificationModel, redisService) {
        this.userModel = userModel;
        this.credentialsModel = credentialsModel;
        this.postModel = postModel;
        this.commentModel = commentModel;
        this.conversationModel = conversationModel;
        this.messageModel = messageModel;
        this.notificationModel = notificationModel;
        this.redisService = redisService;
    }
    async findById(userId, currentUserId) {
        const cacheKey = `user:${userId}`;
        if (!currentUserId || currentUserId === userId) {
            const cached = await this.redisService.get(cacheKey);
            if (cached) {
                const cachedUser = JSON.parse(cached);
                if (!currentUserId || currentUserId === userId) {
                    return cachedUser;
                }
            }
        }
        const user = await this.userModel.findOne({ _id: userId, deletedAt: null });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (currentUserId && user.blockedUsers?.some((id) => id.toString() === currentUserId)) {
            throw new common_1.ForbiddenException('You are blocked by this user');
        }
        const userObj = user.toObject();
        const followerCount = userObj.followers?.length || 0;
        const followingCount = userObj.following?.length || 0;
        let result;
        if (currentUserId && currentUserId !== userId) {
            const currentUser = await this.userModel.findOne({ _id: currentUserId, deletedAt: null }).select('following');
            const isFollowing = currentUser?.following?.some((id) => id.toString() === userId) || false;
            result = {
                ...userObj,
                id: userObj._id.toString(),
                isFollowing,
                followerCount,
                followingCount,
            };
        }
        else {
            result = {
                ...userObj,
                id: userObj._id.toString(),
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
        const sanitizedQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        console.log('🔍 Arama yapılıyor:', sanitizedQuery);
        try {
            const users = await this.userModel
                .find({
                deletedAt: null,
                $or: [
                    { username: { $regex: sanitizedQuery, $options: 'i' } },
                    { fullName: { $regex: sanitizedQuery, $options: 'i' } },
                ],
            })
                .select('_id username fullName avatar bio')
                .limit(20)
                .lean();
            console.log('✅ Bulunan kullanıcı sayısı:', users.length);
            const result = users.map(user => ({
                ...user,
                id: user._id.toString(),
            }));
            await this.redisService.set(cacheKey, JSON.stringify(result), 300);
            return result;
        }
        catch (error) {
            console.error('❌ Arama hatası:', error);
            return [];
        }
    }
    async follow(userId, currentUserId) {
        if (userId === currentUserId) {
            throw new common_1.BadRequestException('Cannot follow yourself');
        }
        const user = await this.userModel.findOne({ _id: userId, deletedAt: null });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const currentUser = await this.userModel.findOne({ _id: currentUserId, deletedAt: null });
        if (!currentUser)
            throw new common_1.NotFoundException('Current user not found');
        const blockedByTarget = user.blockedUsers?.some((id) => id.toString() === currentUserId);
        if (blockedByTarget) {
            throw new common_1.ForbiddenException('You are blocked by this user');
        }
        const hasBlockedTarget = currentUser.blockedUsers?.some((id) => id.toString() === userId);
        if (hasBlockedTarget) {
            throw new common_1.ForbiddenException('You have blocked this user');
        }
        const isAlreadyFollowing = currentUser.following?.some((id) => id.toString() === userId);
        if (isAlreadyFollowing) {
            throw new common_1.BadRequestException('Already following');
        }
        await this.userModel.updateOne({ _id: currentUserId }, { $addToSet: { following: userId } });
        await this.userModel.updateOne({ _id: userId }, { $addToSet: { followers: currentUserId } });
        await this.invalidateFeedCache(currentUserId);
        return { message: 'Followed successfully' };
    }
    async unfollow(userId, currentUserId) {
        await this.userModel.updateOne({ _id: currentUserId }, { $pull: { following: userId } });
        await this.userModel.updateOne({ _id: userId }, { $pull: { followers: currentUserId } });
        await this.invalidateFeedCache(currentUserId);
        return { message: 'Unfollowed successfully' };
    }
    async block(userId, currentUserId) {
        if (userId === currentUserId) {
            throw new common_1.BadRequestException('Cannot block yourself');
        }
        await this.userModel.updateOne({ _id: currentUserId }, { $addToSet: { blockedUsers: userId } });
        await this.unfollow(userId, currentUserId);
        await this.unfollow(currentUserId, userId);
        return { message: 'Blocked successfully' };
    }
    async unblock(userId, currentUserId) {
        await this.userModel.updateOne({ _id: currentUserId }, { $pull: { blockedUsers: userId } });
        return { message: 'Unblocked successfully' };
    }
    async updateProfile(userId, data) {
        const updatedUser = await this.userModel.findOneAndUpdate({ _id: userId, deletedAt: null }, data, { new: true });
        if (!updatedUser)
            throw new common_1.NotFoundException('User not found');
        const userObj = updatedUser.toObject();
        const result = {
            ...userObj,
            id: userObj._id.toString(),
            followerCount: userObj.followers?.length || 0,
            followingCount: userObj.following?.length || 0,
        };
        await this.redisService.del(`user:${userId}`);
        return result;
    }
    async getBlockedUsers(userId) {
        const user = await this.userModel.findOne({ _id: userId, deletedAt: null }).populate('blockedUsers');
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return user.blockedUsers;
    }
    async getFollowers(userId, currentUserId) {
        const user = await this.userModel.findOne({ _id: userId, deletedAt: null });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (currentUserId && user.blockedUsers?.some((id) => id.toString() === currentUserId)) {
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
            const hiddenIds = user.hiddenFollowers.map((id) => id.toString());
            visibleFollowerIds = followerIds.filter((id) => !hiddenIds.includes(id.toString()));
        }
        if (visibleFollowerIds.length === 0)
            return [];
        const followers = await this.userModel.find({
            _id: { $in: visibleFollowerIds },
            deletedAt: null,
        }).select('fullName avatar _id');
        let currentUserFollowing = [];
        if (currentUserId) {
            const currentUser = await this.userModel.findOne({ _id: currentUserId, deletedAt: null }).select('following');
            currentUserFollowing = currentUser?.following?.map((id) => id.toString()) || [];
        }
        return followers.map((follower) => {
            const followerId = follower._id.toString();
            return {
                id: followerId,
                fullName: follower.fullName,
                avatar: follower.avatar,
                isFollowing: currentUserFollowing.includes(followerId),
            };
        });
    }
    async getFollowing(userId, currentUserId) {
        const user = await this.userModel.findOne({ _id: userId, deletedAt: null });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (currentUserId && user.blockedUsers?.some((id) => id.toString() === currentUserId)) {
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
            const hiddenIds = user.hiddenFollowing.map((id) => id.toString());
            visibleFollowingIds = followingIds.filter((id) => !hiddenIds.includes(id.toString()));
        }
        if (visibleFollowingIds.length === 0)
            return [];
        const following = await this.userModel.find({
            _id: { $in: visibleFollowingIds },
            deletedAt: null,
        }).select('fullName avatar _id');
        let currentUserFollowing = [];
        if (currentUserId) {
            const currentUser = await this.userModel.findOne({ _id: currentUserId, deletedAt: null }).select('following');
            currentUserFollowing = currentUser?.following?.map((id) => id.toString()) || [];
        }
        return following.map((followed) => {
            const followedId = followed._id.toString();
            return {
                id: followedId,
                fullName: followed.fullName,
                avatar: followed.avatar,
                isFollowing: currentUserFollowing.includes(followedId),
            };
        });
    }
    async deleteAccount(userId) {
        console.log('🗑️ Kullanıcı hesabı siliniyor (soft delete):', userId);
        const user = await this.userModel.findOne({ _id: userId, deletedAt: null });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const deletedAt = new Date();
        const userPosts = await this.postModel.find({ userId, deletedAt: null }).select('_id');
        const postIds = userPosts.map(p => p._id.toString());
        if (postIds.length > 0) {
            await this.commentModel.updateMany({ postId: { $in: postIds }, deletedAt: null }, { $set: { deletedAt } });
            await this.notificationModel.updateMany({ postId: { $in: postIds }, deletedAt: null }, { $set: { deletedAt } });
            await this.userModel.updateMany({ savedPosts: { $in: postIds } }, { $pull: { savedPosts: { $in: postIds } } });
            await this.postModel.updateMany({ userId, deletedAt: null }, { $set: { deletedAt } });
            console.log(`  ✅ ${postIds.length} post soft delete yapıldı`);
        }
        const deletedComments = await this.commentModel.updateMany({ userId, deletedAt: null }, { $set: { deletedAt } });
        console.log(`  ✅ ${deletedComments.modifiedCount} yorum soft delete yapıldı`);
        const userConversations = await this.conversationModel.find({
            participants: userId,
            deletedAt: null,
        });
        for (const conv of userConversations) {
            await this.messageModel.updateMany({ conversationId: conv._id.toString(), deletedAt: null }, { $set: { deletedAt } });
            const otherParticipants = conv.participants.filter((p) => p.toString() !== userId);
            if (otherParticipants.length === 0) {
                await this.conversationModel.updateOne({ _id: conv._id }, { $set: { deletedAt } });
            }
            else {
                await this.conversationModel.updateOne({ _id: conv._id }, { $pull: { participants: userId } });
            }
        }
        console.log(`  ✅ ${userConversations.length} conversation temizlendi`);
        const deletedNotifications = await this.notificationModel.updateMany({
            $or: [
                { userId, deletedAt: null },
                { fromUserId: userId, deletedAt: null },
            ],
        }, { $set: { deletedAt } });
        console.log(`  ✅ ${deletedNotifications.modifiedCount} bildirim soft delete yapıldı`);
        await this.userModel.updateMany({ following: userId, deletedAt: null }, { $pull: { following: userId } });
        await this.userModel.updateMany({ followers: userId, deletedAt: null }, { $pull: { followers: userId } });
        console.log('  ✅ Follow ilişkileri temizlendi');
        await this.userModel.updateMany({ blockedUsers: userId, deletedAt: null }, { $pull: { blockedUsers: userId } });
        console.log('  ✅ Block ilişkileri temizlendi');
        await this.userModel.updateOne({ _id: userId }, { $set: { savedPosts: [] } });
        await this.credentialsModel.deleteOne({ userId });
        console.log('  ✅ Kullanıcı kimlik bilgileri silindi');
        await this.userModel.updateOne({ _id: userId }, { $set: { deletedAt } });
        console.log('  ✅ Kullanıcı hesabı soft delete yapıldı');
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
    __param(0, (0, mongoose_1.InjectModel)(user_entity_1.User.name)),
    __param(1, (0, mongoose_1.InjectModel)(user_credentials_entity_1.UserCredentials.name)),
    __param(2, (0, mongoose_1.InjectModel)(post_entity_1.Post.name)),
    __param(3, (0, mongoose_1.InjectModel)(comment_entity_1.Comment.name)),
    __param(4, (0, mongoose_1.InjectModel)(conversation_entity_1.Conversation.name)),
    __param(5, (0, mongoose_1.InjectModel)(message_entity_1.Message.name)),
    __param(6, (0, mongoose_1.InjectModel)(notification_entity_1.Notification.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        redis_service_1.RedisService])
], UsersService);
//# sourceMappingURL=users.service.js.map