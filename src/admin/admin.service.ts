import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull, MoreThan, LessThanOrEqual } from 'typeorm';
import { User } from '../entities/user.entity';
import { ActivityLog, ActivityType } from '../entities/activity-log.entity';
import { Post } from '../entities/post.entity';
import { BanUserDto } from './dto/ban-user.dto';
import { ChangeRoleDto } from './dto/change-role.dto';
import { isValidId } from '../common/utils/id.util';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(ActivityLog) private activityLogRepository: Repository<ActivityLog>,
    @InjectRepository(Post) private postRepository: Repository<Post>,
  ) {}

  async getDashboardStatistics() {
    const totalUsers = await this.userRepository.count({ where: { deletedAt: IsNull() } });

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const newUsersToday = await this.userRepository.count({
      where: {
        createdAt: MoreThan(oneDayAgo),
        deletedAt: IsNull(),
      },
    });

    const newUsersThisWeek = await this.userRepository.count({
      where: {
        createdAt: MoreThan(oneWeekAgo),
        deletedAt: IsNull(),
      },
    });

    const bannedUsers = await this.userRepository
      .createQueryBuilder('u')
      .where('u.deletedAt IS NULL')
      .andWhere('(u.isPermanentlyBanned = true OR u.bannedUntil > :now)', { now: new Date() })
      .getCount();

    const warnedUsers = await this.userRepository.count({
      where: {
        warningCount: MoreThan(0),
        deletedAt: IsNull(),
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

  async getUsers(
    page: number = 1,
    limit: number = 20,
    search?: string,
    role?: string,
    isBanned?: boolean,
  ) {
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
      } else {
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

  async getUserById(userId: string) {
    if (!isValidId(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId, deletedAt: IsNull() },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const postCount = await this.postRepository.count({
      where: { userId, deletedAt: IsNull() },
    });

    const activityLogs = await this.activityLogRepository.find({
      where: { targetUserId: userId },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    const adminIds = Array.from(new Set(activityLogs.map((l) => l.adminId).filter(Boolean)));
    let adminMap = new Map<string, User>();
    if (adminIds.length > 0) {
      const admins = await this.userRepository.find({
        where: { id: In(adminIds) },
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

  async banUser(targetUserId: string, adminId: string, banUserDto: BanUserDto) {
    if (!isValidId(targetUserId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const targetUser = await this.userRepository.findOne({
      where: { id: targetUserId, deletedAt: IsNull() },
    });
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    const admin = await this.userRepository.findOne({
      where: { id: adminId },
    });
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    if (targetUser.role === 'admin' || targetUser.role === 'super_admin') {
      if (admin.role !== 'super_admin') {
        throw new ForbiddenException('Cannot ban admin users');
      }
    }

    if (banUserDto.isPermanent) {
      targetUser.isPermanentlyBanned = true;
      targetUser.bannedUntil = null;
    } else if (banUserDto.bannedUntil) {
      targetUser.isPermanentlyBanned = false;
      targetUser.bannedUntil = new Date(banUserDto.bannedUntil);
    } else {
      throw new BadRequestException('Either isPermanent or bannedUntil must be provided');
    }

    await this.userRepository.save(targetUser);

    const log = this.activityLogRepository.create({
      adminId,
      activityType: ActivityType.USER_BANNED,
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

  async unbanUser(targetUserId: string, adminId: string) {
    if (!isValidId(targetUserId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const targetUser = await this.userRepository.findOne({
      where: { id: targetUserId, deletedAt: IsNull() },
    });
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    targetUser.isPermanentlyBanned = false;
    targetUser.bannedUntil = null;
    await this.userRepository.save(targetUser);

    const log = this.activityLogRepository.create({
      adminId,
      activityType: ActivityType.USER_UNBANNED,
      targetUserId,
      description: 'User unbanned',
    });
    await this.activityLogRepository.save(log);

    return targetUser;
  }

  async warnUser(targetUserId: string, adminId: string, reason?: string) {
    if (!isValidId(targetUserId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const targetUser = await this.userRepository.findOne({
      where: { id: targetUserId, deletedAt: IsNull() },
    });
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    targetUser.warningCount = (targetUser.warningCount || 0) + 1;
    await this.userRepository.save(targetUser);

    const log = this.activityLogRepository.create({
      adminId,
      activityType: ActivityType.USER_WARNED,
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

  async changeUserRole(targetUserId: string, adminId: string, changeRoleDto: ChangeRoleDto) {
    if (!isValidId(targetUserId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const targetUser = await this.userRepository.findOne({
      where: { id: targetUserId, deletedAt: IsNull() },
    });
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    const admin = await this.userRepository.findOne({
      where: { id: adminId },
    });
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    if (
      (changeRoleDto.role === 'admin' || changeRoleDto.role === 'super_admin') &&
      admin.role !== 'super_admin'
    ) {
      throw new ForbiddenException('Only super admin can assign admin roles');
    }

    if (
      admin.role === 'moderator' &&
      (changeRoleDto.role === 'moderator' || changeRoleDto.role === 'admin' || changeRoleDto.role === 'super_admin')
    ) {
      throw new ForbiddenException('Moderators cannot assign moderator, admin, or super_admin roles');
    }

    const oldRole = targetUser.role;
    targetUser.role = changeRoleDto.role;
    await this.userRepository.save(targetUser);

    const log = this.activityLogRepository.create({
      adminId,
      activityType: ActivityType.ROLE_CHANGED,
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

  async deletePost(postId: string, adminId: string, reason?: string) {
    if (!isValidId(postId)) {
      throw new BadRequestException('Invalid post ID format');
    }

    const post = await this.postRepository.findOne({
      where: { id: postId, deletedAt: IsNull() },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    post.deletedAt = new Date();
    await this.postRepository.save(post);

    const log = this.activityLogRepository.create({
      adminId,
      activityType: ActivityType.POST_DELETED,
      targetPostId: postId,
      targetUserId: post.userId,
      description: 'Post deleted by admin',
      metadata: { reason },
    });
    await this.activityLogRepository.save(log);

    return { success: true };
  }

  async getActivityLogs(
    page: number = 1,
    limit: number = 20,
    adminId?: string,
    activityType?: ActivityType,
  ) {
    const skip = (page - 1) * limit;
    const maxLimit = Math.min(limit, 100);

    const query = this.activityLogRepository.createQueryBuilder('log');

    if (adminId) query.andWhere('log.adminId = :adminId', { adminId });
    if (activityType) query.andWhere('log.activityType = :activityType', { activityType });

    const [logs, total] = await query
      .orderBy('log.createdAt', 'DESC')
      .skip(skip)
      .take(maxLimit)
      .getManyAndCount();

    const relatedUserIds = Array.from(
      new Set(
        [
          ...logs.map((l) => l.adminId),
          ...logs.map((l) => l.targetUserId).filter(Boolean),
        ] as string[],
      ),
    );

    let userMap = new Map<string, User>();
    if (relatedUserIds.length > 0) {
      const users = await this.userRepository.find({
        where: { id: In(relatedUserIds) },
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
}
