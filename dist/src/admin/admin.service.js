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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_entity_1 = require("../entities/user.entity");
const activity_log_entity_1 = require("../entities/activity-log.entity");
let AdminService = class AdminService {
    userModel;
    activityLogModel;
    postModel;
    constructor(userModel, activityLogModel, postModel) {
        this.userModel = userModel;
        this.activityLogModel = activityLogModel;
        this.postModel = postModel;
    }
    async getDashboardStatistics() {
        const totalUsers = await this.userModel.countDocuments({ deletedAt: null });
        const newUsersToday = await this.userModel.countDocuments({
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            deletedAt: null,
        });
        const newUsersThisWeek = await this.userModel.countDocuments({
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            deletedAt: null,
        });
        const bannedUsers = await this.userModel.countDocuments({
            $or: [
                { isPermanentlyBanned: true },
                { bannedUntil: { $gt: new Date() } },
            ],
            deletedAt: null,
        });
        const warnedUsers = await this.userModel.countDocuments({
            warningCount: { $gt: 0 },
            deletedAt: null,
        });
        return {
            totalUsers,
            newUsersToday,
            newUsersThisWeek,
            bannedUsers,
            warnedUsers,
        };
    }
    async getUsers(page = 1, limit = 20, search, role, isBanned) {
        const skip = (page - 1) * limit;
        const maxLimit = Math.min(limit, 100);
        const filter = { deletedAt: null };
        if (search) {
            filter.fullName = { $regex: search, $options: 'i' };
        }
        if (role)
            filter.role = role;
        if (isBanned !== undefined) {
            if (isBanned) {
                filter.$or = [
                    { isPermanentlyBanned: true },
                    { bannedUntil: { $gt: new Date() } },
                ];
            }
            else {
                filter.isPermanentlyBanned = false;
                filter.$or = [
                    { bannedUntil: null },
                    { bannedUntil: { $lte: new Date() } },
                ];
            }
        }
        const users = await this.userModel
            .find(filter)
            .select('-savedPosts')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(maxLimit)
            .lean();
        const total = await this.userModel.countDocuments(filter);
        return {
            users: users.map((user) => ({
                id: user._id.toString(),
                fullName: user.fullName,
                avatar: user.avatar,
                bio: user.bio,
                role: user.role || 'user',
                warningCount: user.warningCount || 0,
                bannedUntil: user.bannedUntil || null,
                isPermanentlyBanned: user.isPermanentlyBanned || false,
                followerCount: user.followers?.length || 0,
                followingCount: user.following?.length || 0,
                isVerified: user.isVerified || false,
                createdAt: user.createdAt,
            })),
            pagination: {
                page,
                limit: maxLimit,
                total,
                hasMore: skip + users.length < total,
            },
        };
    }
    async getUserById(userId) {
        if (!mongoose_2.Types.ObjectId.isValid(userId)) {
            throw new common_1.BadRequestException('Invalid user ID format');
        }
        const user = await this.userModel.findById(userId).lean();
        if (!user || user.deletedAt) {
            throw new common_1.NotFoundException('User not found');
        }
        const postCount = await this.postModel.countDocuments({
            userId,
            deletedAt: null,
        });
        const activityLogs = await this.activityLogModel
            .find({ targetUserId: userId })
            .populate('adminId', 'fullName avatar')
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();
        return {
            id: user._id.toString(),
            fullName: user.fullName,
            avatar: user.avatar,
            bio: user.bio,
            role: user.role || 'user',
            warningCount: user.warningCount || 0,
            bannedUntil: user.bannedUntil || null,
            isPermanentlyBanned: user.isPermanentlyBanned || false,
            followerCount: user.followers?.length || 0,
            followingCount: user.following?.length || 0,
            postCount,
            isVerified: user.isVerified || false,
            activityLogs: activityLogs.map((log) => ({
                id: log._id.toString(),
                adminId: (log.adminId?._id || log.adminId)?.toString(),
                activityType: log.activityType,
                targetUserId: log.targetUserId,
                targetPostId: log.targetPostId,
                description: log.description,
                metadata: log.metadata,
                admin: log.adminId && typeof log.adminId === 'object' ? {
                    id: (log.adminId._id || log.adminId).toString(),
                    fullName: log.adminId.fullName,
                    avatar: log.adminId.avatar,
                } : null,
                createdAt: log.createdAt || new Date(),
            })),
            createdAt: user.createdAt || new Date(),
        };
    }
    async banUser(targetUserId, adminId, banUserDto) {
        if (!mongoose_2.Types.ObjectId.isValid(targetUserId)) {
            throw new common_1.BadRequestException('Invalid user ID format');
        }
        const targetUser = await this.userModel.findById(targetUserId);
        if (!targetUser || targetUser.deletedAt) {
            throw new common_1.NotFoundException('User not found');
        }
        const admin = await this.userModel.findById(adminId);
        if (!admin) {
            throw new common_1.NotFoundException('Admin not found');
        }
        if (targetUser.role === 'admin' || targetUser.role === 'super_admin') {
            if (admin.role !== 'super_admin') {
                throw new common_1.ForbiddenException('Cannot ban admin users');
            }
        }
        if (banUserDto.isPermanent) {
            targetUser.isPermanentlyBanned = true;
            targetUser.bannedUntil = null;
        }
        else if (banUserDto.bannedUntil) {
            targetUser.isPermanentlyBanned = false;
            targetUser.bannedUntil = new Date(banUserDto.bannedUntil);
        }
        else {
            throw new common_1.BadRequestException('Either isPermanent or bannedUntil must be provided');
        }
        await targetUser.save();
        await this.activityLogModel.create({
            adminId,
            activityType: activity_log_entity_1.ActivityType.USER_BANNED,
            targetUserId,
            description: `User banned${banUserDto.isPermanent ? ' permanently' : ` until ${banUserDto.bannedUntil}`}`,
            metadata: {
                isPermanent: banUserDto.isPermanent,
                bannedUntil: banUserDto.bannedUntil,
                reason: banUserDto.reason,
            },
        });
        return targetUser;
    }
    async unbanUser(targetUserId, adminId) {
        if (!mongoose_2.Types.ObjectId.isValid(targetUserId)) {
            throw new common_1.BadRequestException('Invalid user ID format');
        }
        const targetUser = await this.userModel.findById(targetUserId);
        if (!targetUser || targetUser.deletedAt) {
            throw new common_1.NotFoundException('User not found');
        }
        targetUser.isPermanentlyBanned = false;
        targetUser.bannedUntil = null;
        await targetUser.save();
        await this.activityLogModel.create({
            adminId,
            activityType: activity_log_entity_1.ActivityType.USER_UNBANNED,
            targetUserId,
            description: 'User unbanned',
        });
        return targetUser;
    }
    async warnUser(targetUserId, adminId, reason) {
        if (!mongoose_2.Types.ObjectId.isValid(targetUserId)) {
            throw new common_1.BadRequestException('Invalid user ID format');
        }
        const targetUser = await this.userModel.findById(targetUserId);
        if (!targetUser || targetUser.deletedAt) {
            throw new common_1.NotFoundException('User not found');
        }
        targetUser.warningCount = (targetUser.warningCount || 0) + 1;
        await targetUser.save();
        await this.activityLogModel.create({
            adminId,
            activityType: activity_log_entity_1.ActivityType.USER_WARNED,
            targetUserId,
            description: `User warned (Total warnings: ${targetUser.warningCount})`,
            metadata: {
                warningCount: targetUser.warningCount,
                reason,
            },
        });
        return targetUser;
    }
    async changeUserRole(targetUserId, adminId, changeRoleDto) {
        if (!mongoose_2.Types.ObjectId.isValid(targetUserId)) {
            throw new common_1.BadRequestException('Invalid user ID format');
        }
        const targetUser = await this.userModel.findById(targetUserId);
        if (!targetUser || targetUser.deletedAt) {
            throw new common_1.NotFoundException('User not found');
        }
        const admin = await this.userModel.findById(adminId);
        if (!admin) {
            throw new common_1.NotFoundException('Admin not found');
        }
        if ((changeRoleDto.role === 'admin' || changeRoleDto.role === 'super_admin') &&
            admin.role !== 'super_admin') {
            throw new common_1.ForbiddenException('Only super admin can assign admin roles');
        }
        if (admin.role === 'moderator' &&
            (changeRoleDto.role === 'moderator' || changeRoleDto.role === 'admin' || changeRoleDto.role === 'super_admin')) {
            throw new common_1.ForbiddenException('Moderators cannot assign moderator, admin, or super_admin roles');
        }
        const oldRole = targetUser.role;
        targetUser.role = changeRoleDto.role;
        await targetUser.save();
        await this.activityLogModel.create({
            adminId,
            activityType: activity_log_entity_1.ActivityType.ROLE_CHANGED,
            targetUserId,
            description: `User role changed from ${oldRole} to ${changeRoleDto.role}`,
            metadata: {
                oldRole,
                newRole: changeRoleDto.role,
            },
        });
        return targetUser;
    }
    async deletePost(postId, adminId, reason) {
        if (!mongoose_2.Types.ObjectId.isValid(postId)) {
            throw new common_1.BadRequestException('Invalid post ID format');
        }
        const post = await this.postModel.findById(postId);
        if (!post) {
            throw new common_1.NotFoundException('Post not found');
        }
        post.deletedAt = new Date();
        await post.save();
        await this.activityLogModel.create({
            adminId,
            activityType: activity_log_entity_1.ActivityType.POST_DELETED,
            targetPostId: postId,
            targetUserId: post.userId.toString(),
            description: 'Post deleted by admin',
            metadata: { reason },
        });
        return { success: true };
    }
    async getActivityLogs(page = 1, limit = 20, adminId, activityType) {
        const skip = (page - 1) * limit;
        const maxLimit = Math.min(limit, 100);
        const filter = {};
        if (adminId)
            filter.adminId = adminId;
        if (activityType)
            filter.activityType = activityType;
        const logs = await this.activityLogModel
            .find(filter)
            .populate('adminId', 'fullName avatar role')
            .populate('targetUserId', 'fullName avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(maxLimit)
            .lean();
        const total = await this.activityLogModel.countDocuments(filter);
        return {
            logs,
            pagination: {
                page,
                limit: maxLimit,
                total,
                hasMore: skip + logs.length < total,
            },
        };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_entity_1.User.name)),
    __param(1, (0, mongoose_1.InjectModel)(activity_log_entity_1.ActivityLog.name)),
    __param(2, (0, mongoose_1.InjectModel)('Post')),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], AdminService);
//# sourceMappingURL=admin.service.js.map