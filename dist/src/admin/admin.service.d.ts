import { Model, Types } from 'mongoose';
import { User } from '../entities/user.entity';
import { ActivityLog, ActivityType } from '../entities/activity-log.entity';
import { BanUserDto } from './dto/ban-user.dto';
import { ChangeRoleDto } from './dto/change-role.dto';
export declare class AdminService {
    private userModel;
    private activityLogModel;
    private postModel;
    constructor(userModel: Model<User>, activityLogModel: Model<ActivityLog>, postModel: Model<any>);
    getDashboardStatistics(): Promise<{
        totalUsers: number;
        newUsersToday: number;
        newUsersThisWeek: number;
        bannedUsers: number;
        warnedUsers: number;
    }>;
    getUsers(page?: number, limit?: number, search?: string, role?: string, isBanned?: boolean): Promise<{
        users: {
            id: any;
            fullName: any;
            avatar: any;
            bio: any;
            role: any;
            warningCount: any;
            bannedUntil: any;
            isPermanentlyBanned: any;
            followerCount: any;
            followingCount: any;
            isVerified: any;
            createdAt: any;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            hasMore: boolean;
        };
    }>;
    getUserById(userId: string): Promise<{
        id: string;
        fullName: string;
        avatar: string;
        bio: string;
        role: string;
        warningCount: number;
        bannedUntil: Date | null;
        isPermanentlyBanned: boolean;
        followerCount: number;
        followingCount: number;
        postCount: number;
        isVerified: boolean;
        activityLogs: {
            id: any;
            adminId: any;
            activityType: any;
            targetUserId: any;
            targetPostId: any;
            description: any;
            metadata: any;
            admin: {
                id: any;
                fullName: any;
                avatar: any;
            } | null;
            createdAt: any;
        }[];
        createdAt: any;
    }>;
    banUser(targetUserId: string, adminId: string, banUserDto: BanUserDto): Promise<import("mongoose").Document<unknown, {}, User, {}, import("mongoose").DefaultSchemaOptions> & User & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    unbanUser(targetUserId: string, adminId: string): Promise<import("mongoose").Document<unknown, {}, User, {}, import("mongoose").DefaultSchemaOptions> & User & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    warnUser(targetUserId: string, adminId: string, reason?: string): Promise<import("mongoose").Document<unknown, {}, User, {}, import("mongoose").DefaultSchemaOptions> & User & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    changeUserRole(targetUserId: string, adminId: string, changeRoleDto: ChangeRoleDto): Promise<import("mongoose").Document<unknown, {}, User, {}, import("mongoose").DefaultSchemaOptions> & User & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    deletePost(postId: string, adminId: string, reason?: string): Promise<{
        success: boolean;
    }>;
    getActivityLogs(page?: number, limit?: number, adminId?: string, activityType?: ActivityType): Promise<{
        logs: (ActivityLog & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            hasMore: boolean;
        };
    }>;
}
