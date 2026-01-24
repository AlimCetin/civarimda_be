import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../entities/user.entity';
import { ActivityLog, ActivityType } from '../entities/activity-log.entity';
import { BanUserDto } from './dto/ban-user.dto';
import { ChangeRoleDto } from './dto/change-role.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(ActivityLog.name) private activityLogModel: Model<ActivityLog>,
    @InjectModel('Post') private postModel: Model<any>,
  ) {}

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

  async getUsers(
    page: number = 1,
    limit: number = 20,
    search?: string,
    role?: string,
    isBanned?: boolean,
  ) {
    const skip = (page - 1) * limit;
    const maxLimit = Math.min(limit, 100);

    const filter: any = { deletedAt: null };
    if (search) {
      filter.fullName = { $regex: search, $options: 'i' };
    }
    if (role) filter.role = role;
    if (isBanned !== undefined) {
      if (isBanned) {
        filter.$or = [
          { isPermanentlyBanned: true },
          { bannedUntil: { $gt: new Date() } },
        ];
      } else {
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
      users: users.map((user: any) => ({
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

  async getUserById(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const user = await this.userModel.findById(userId).lean();
    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found');
    }

    // Get user statistics
    const postCount = await this.postModel.countDocuments({
      userId,
      deletedAt: null,
    });

    // Get activity logs related to this user
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
      activityLogs: activityLogs.map((log: any) => ({
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
      createdAt: (user as any).createdAt || new Date(),
    };
  }

  async banUser(
    targetUserId: string,
    adminId: string,
    banUserDto: BanUserDto,
  ) {
    if (!Types.ObjectId.isValid(targetUserId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const targetUser = await this.userModel.findById(targetUserId);
    if (!targetUser || targetUser.deletedAt) {
      throw new NotFoundException('User not found');
    }

    const admin = await this.userModel.findById(adminId);
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    // Prevent admins from banning other admins/super_admins
    if (targetUser.role === 'admin' || targetUser.role === 'super_admin') {
      if (admin.role !== 'super_admin') {
        throw new ForbiddenException('Cannot ban admin users');
      }
    }

    // Apply ban
    if (banUserDto.isPermanent) {
      targetUser.isPermanentlyBanned = true;
      targetUser.bannedUntil = null;
    } else if (banUserDto.bannedUntil) {
      targetUser.isPermanentlyBanned = false;
      targetUser.bannedUntil = new Date(banUserDto.bannedUntil);
    } else {
      throw new BadRequestException('Either isPermanent or bannedUntil must be provided');
    }

    await targetUser.save();

    // Log activity
    await this.activityLogModel.create({
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

    return targetUser;
  }

  async unbanUser(targetUserId: string, adminId: string) {
    if (!Types.ObjectId.isValid(targetUserId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const targetUser = await this.userModel.findById(targetUserId);
    if (!targetUser || targetUser.deletedAt) {
      throw new NotFoundException('User not found');
    }

    targetUser.isPermanentlyBanned = false;
    targetUser.bannedUntil = null;
    await targetUser.save();

    // Log activity
    await this.activityLogModel.create({
      adminId,
      activityType: ActivityType.USER_UNBANNED,
      targetUserId,
      description: 'User unbanned',
    });

    return targetUser;
  }

  async warnUser(targetUserId: string, adminId: string, reason?: string) {
    if (!Types.ObjectId.isValid(targetUserId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const targetUser = await this.userModel.findById(targetUserId);
    if (!targetUser || targetUser.deletedAt) {
      throw new NotFoundException('User not found');
    }

    targetUser.warningCount = (targetUser.warningCount || 0) + 1;
    await targetUser.save();

    // Log activity
    await this.activityLogModel.create({
      adminId,
      activityType: ActivityType.USER_WARNED,
      targetUserId,
      description: `User warned (Total warnings: ${targetUser.warningCount})`,
      metadata: {
        warningCount: targetUser.warningCount,
        reason,
      },
    });

    return targetUser;
  }

  async changeUserRole(
    targetUserId: string,
    adminId: string,
    changeRoleDto: ChangeRoleDto,
  ) {
    if (!Types.ObjectId.isValid(targetUserId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const targetUser = await this.userModel.findById(targetUserId);
    if (!targetUser || targetUser.deletedAt) {
      throw new NotFoundException('User not found');
    }

    const admin = await this.userModel.findById(adminId);
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    // Only super_admin can change roles to admin/super_admin
    if (
      (changeRoleDto.role === 'admin' || changeRoleDto.role === 'super_admin') &&
      admin.role !== 'super_admin'
    ) {
      throw new ForbiddenException('Only super admin can assign admin roles');
    }

    // Moderators cannot assign moderator/admin/super_admin roles, only user role
    if (
      admin.role === 'moderator' &&
      (changeRoleDto.role === 'moderator' || changeRoleDto.role === 'admin' || changeRoleDto.role === 'super_admin')
    ) {
      throw new ForbiddenException('Moderators cannot assign moderator, admin, or super_admin roles');
    }

    const oldRole = targetUser.role;
    targetUser.role = changeRoleDto.role;
    await targetUser.save();

    // Log activity
    await this.activityLogModel.create({
      adminId,
      activityType: ActivityType.ROLE_CHANGED,
      targetUserId,
      description: `User role changed from ${oldRole} to ${changeRoleDto.role}`,
      metadata: {
        oldRole,
        newRole: changeRoleDto.role,
      },
    });

    return targetUser;
  }

  async deletePost(postId: string, adminId: string, reason?: string) {
    if (!Types.ObjectId.isValid(postId)) {
      throw new BadRequestException('Invalid post ID format');
    }

    const post = await this.postModel.findById(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Soft delete
    (post as any).deletedAt = new Date();
    await post.save();

    // Log activity
    await this.activityLogModel.create({
      adminId,
      activityType: ActivityType.POST_DELETED,
      targetPostId: postId,
      targetUserId: (post.userId as any).toString(),
      description: 'Post deleted by admin',
      metadata: { reason },
    });

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

    const filter: any = {};
    if (adminId) filter.adminId = adminId;
    if (activityType) filter.activityType = activityType;

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
}

