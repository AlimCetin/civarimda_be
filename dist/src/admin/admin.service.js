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
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../entities/user.entity");
const activity_log_entity_1 = require("../entities/activity-log.entity");
const post_entity_1 = require("../entities/post.entity");
const id_util_1 = require("../common/utils/id.util");
let AdminService = class AdminService {
    userRepository;
    activityLogRepository;
    postRepository;
    constructor(userRepository, activityLogRepository, postRepository) {
        this.userRepository = userRepository;
        this.activityLogRepository = activityLogRepository;
        this.postRepository = postRepository;
    }
    async getDashboardStatistics() {
        const totalUsers = await this.userRepository.count({ where: { deletedAt: (0, typeorm_2.IsNull)() } });
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const newUsersToday = await this.userRepository.count({
            where: {
                createdAt: (0, typeorm_2.MoreThan)(oneDayAgo),
                deletedAt: (0, typeorm_2.IsNull)(),
            },
        });
        const newUsersThisWeek = await this.userRepository.count({
            where: {
                createdAt: (0, typeorm_2.MoreThan)(oneWeekAgo),
                deletedAt: (0, typeorm_2.IsNull)(),
            },
        });
        const bannedUsers = await this.userRepository
            .createQueryBuilder('u')
            .where('u.deletedAt IS NULL')
            .andWhere('(u.isPermanentlyBanned = true OR u.bannedUntil > :now)', { now: new Date() })
            .getCount();
        const warnedUsers = await this.userRepository.count({
            where: {
                warningCount: (0, typeorm_2.MoreThan)(0),
                deletedAt: (0, typeorm_2.IsNull)(),
            },
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
        const query = this.userRepository.createQueryBuilder('u').where('u.deletedAt IS NULL');
        if (search) {
            query.andWhere('u.fullName ILIKE :search', { search: `%${search}%` });
        }
        if (role) {
            query.andWhere('u.role = :role', { role });
        }
        if (isBanned !== undefined) {
            if (isBanned) {
                query.andWhere('(u.isPermanentlyBanned = true OR u.bannedUntil > :now)', { now: new Date() });
            }
            else {
                query.andWhere('u.isPermanentlyBanned = false AND (u.bannedUntil IS NULL OR u.bannedUntil <= :now)', {
                    now: new Date(),
                });
            }
        }
        const [users, total] = await query
            .orderBy('u.createdAt', 'DESC')
            .skip(skip)
            .take(maxLimit)
            .getManyAndCount();
        return {
            users: users.map((user) => ({
                id: user.id,
                _id: user.id,
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
        if (!(0, id_util_1.isValidId)(userId)) {
            throw new common_1.BadRequestException('Invalid user ID format');
        }
        const user = await this.userRepository.findOne({
            where: { id: userId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const postCount = await this.postRepository.count({
            where: { userId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        const activityLogs = await this.activityLogRepository.find({
            where: { targetUserId: userId },
            order: { createdAt: 'DESC' },
            take: 10,
        });
        const adminIds = Array.from(new Set(activityLogs.map((l) => l.adminId).filter(Boolean)));
        let adminMap = new Map();
        if (adminIds.length > 0) {
            const admins = await this.userRepository.find({
                where: { id: (0, typeorm_2.In)(adminIds) },
                select: ['id', 'fullName', 'avatar'],
            });
            adminMap = new Map(admins.map((a) => [a.id, a]));
        }
        return {
            id: user.id,
            _id: user.id,
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
            activityLogs: activityLogs.map((log) => {
                const admin = adminMap.get(log.adminId);
                return {
                    id: log.id,
                    adminId: log.adminId,
                    activityType: log.activityType,
                    targetUserId: log.targetUserId,
                    targetPostId: log.targetPostId,
                    description: log.description,
                    metadata: log.metadata,
                    admin: admin
                        ? {
                            id: admin.id,
                            fullName: admin.fullName,
                            avatar: admin.avatar,
                        }
                        : null,
                    createdAt: log.createdAt,
                };
            }),
            createdAt: user.createdAt,
        };
    }
    async banUser(targetUserId, adminId, banUserDto) {
        if (!(0, id_util_1.isValidId)(targetUserId)) {
            throw new common_1.BadRequestException('Invalid user ID format');
        }
        const targetUser = await this.userRepository.findOne({
            where: { id: targetUserId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!targetUser) {
            throw new common_1.NotFoundException('User not found');
        }
        const admin = await this.userRepository.findOne({
            where: { id: adminId },
        });
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
        await this.userRepository.save(targetUser);
        const log = this.activityLogRepository.create({
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
        await this.activityLogRepository.save(log);
        return targetUser;
    }
    async unbanUser(targetUserId, adminId) {
        if (!(0, id_util_1.isValidId)(targetUserId)) {
            throw new common_1.BadRequestException('Invalid user ID format');
        }
        const targetUser = await this.userRepository.findOne({
            where: { id: targetUserId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!targetUser) {
            throw new common_1.NotFoundException('User not found');
        }
        targetUser.isPermanentlyBanned = false;
        targetUser.bannedUntil = null;
        await this.userRepository.save(targetUser);
        const log = this.activityLogRepository.create({
            adminId,
            activityType: activity_log_entity_1.ActivityType.USER_UNBANNED,
            targetUserId,
            description: 'User unbanned',
        });
        await this.activityLogRepository.save(log);
        return targetUser;
    }
    async warnUser(targetUserId, adminId, reason) {
        if (!(0, id_util_1.isValidId)(targetUserId)) {
            throw new common_1.BadRequestException('Invalid user ID format');
        }
        const targetUser = await this.userRepository.findOne({
            where: { id: targetUserId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!targetUser) {
            throw new common_1.NotFoundException('User not found');
        }
        targetUser.warningCount = (targetUser.warningCount || 0) + 1;
        await this.userRepository.save(targetUser);
        const log = this.activityLogRepository.create({
            adminId,
            activityType: activity_log_entity_1.ActivityType.USER_WARNED,
            targetUserId,
            description: `User warned (Total warnings: ${targetUser.warningCount})`,
            metadata: {
                warningCount: targetUser.warningCount,
                reason,
            },
        });
        await this.activityLogRepository.save(log);
        return targetUser;
    }
    async changeUserRole(targetUserId, adminId, changeRoleDto) {
        if (!(0, id_util_1.isValidId)(targetUserId)) {
            throw new common_1.BadRequestException('Invalid user ID format');
        }
        const targetUser = await this.userRepository.findOne({
            where: { id: targetUserId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!targetUser) {
            throw new common_1.NotFoundException('User not found');
        }
        const admin = await this.userRepository.findOne({
            where: { id: adminId },
        });
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
        await this.userRepository.save(targetUser);
        const log = this.activityLogRepository.create({
            adminId,
            activityType: activity_log_entity_1.ActivityType.ROLE_CHANGED,
            targetUserId,
            description: `User role changed from ${oldRole} to ${changeRoleDto.role}`,
            metadata: {
                oldRole,
                newRole: changeRoleDto.role,
            },
        });
        await this.activityLogRepository.save(log);
        return targetUser;
    }
    async deletePost(postId, adminId, reason) {
        if (!(0, id_util_1.isValidId)(postId)) {
            throw new common_1.BadRequestException('Invalid post ID format');
        }
        const post = await this.postRepository.findOne({
            where: { id: postId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!post) {
            throw new common_1.NotFoundException('Post not found');
        }
        post.deletedAt = new Date();
        await this.postRepository.save(post);
        const log = this.activityLogRepository.create({
            adminId,
            activityType: activity_log_entity_1.ActivityType.POST_DELETED,
            targetPostId: postId,
            targetUserId: post.userId,
            description: 'Post deleted by admin',
            metadata: { reason },
        });
        await this.activityLogRepository.save(log);
        return { success: true };
    }
    async getActivityLogs(page = 1, limit = 20, adminId, activityType) {
        const skip = (page - 1) * limit;
        const maxLimit = Math.min(limit, 100);
        const query = this.activityLogRepository.createQueryBuilder('log');
        if (adminId)
            query.andWhere('log.adminId = :adminId', { adminId });
        if (activityType)
            query.andWhere('log.activityType = :activityType', { activityType });
        const [logs, total] = await query
            .orderBy('log.createdAt', 'DESC')
            .skip(skip)
            .take(maxLimit)
            .getManyAndCount();
        const relatedUserIds = Array.from(new Set([
            ...logs.map((l) => l.adminId),
            ...logs.map((l) => l.targetUserId).filter(Boolean),
        ]));
        let userMap = new Map();
        if (relatedUserIds.length > 0) {
            const users = await this.userRepository.find({
                where: { id: (0, typeorm_2.In)(relatedUserIds) },
                select: ['id', 'fullName', 'avatar', 'role'],
            });
            userMap = new Map(users.map((u) => [u.id, u]));
        }
        return {
            logs: logs.map((log) => {
                const admin = userMap.get(log.adminId);
                const targetUser = log.targetUserId ? userMap.get(log.targetUserId) : null;
                return {
                    id: log.id,
                    _id: log.id,
                    adminId: log.adminId,
                    activityType: log.activityType,
                    targetUserId: log.targetUserId,
                    targetPostId: log.targetPostId,
                    description: log.description,
                    metadata: log.metadata,
                    admin: admin
                        ? {
                            id: admin.id,
                            _id: admin.id,
                            fullName: admin.fullName,
                            avatar: admin.avatar,
                            role: admin.role,
                        }
                        : null,
                    targetUser: targetUser
                        ? {
                            id: targetUser.id,
                            _id: targetUser.id,
                            fullName: targetUser.fullName,
                            avatar: targetUser.avatar,
                        }
                        : null,
                    createdAt: log.createdAt,
                };
            }),
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
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(activity_log_entity_1.ActivityLog)),
    __param(2, (0, typeorm_1.InjectRepository)(post_entity_1.Post)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AdminService);
//# sourceMappingURL=admin.service.js.map