import { User } from '../entities/user.entity';
import { AdminService } from './admin.service';
import { BanUserDto } from './dto/ban-user.dto';
import { ChangeRoleDto } from './dto/change-role.dto';
import { ActivityType } from '../entities/activity-log.entity';
export declare class AdminController {
    private adminService;
    constructor(adminService: AdminService);
    getDashboard(): Promise<{
        totalUsers: number;
        newUsersToday: number;
        newUsersThisWeek: number;
        bannedUsers: number;
        warnedUsers: number;
    }>;
    getUsers(page?: number, limit?: number, search?: string, role?: string, isBanned?: string): Promise<{
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
    getUserById(id: string): Promise<{
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
    banUser(id: string, banUserDto: BanUserDto, admin: User): Promise<import("mongoose").Document<unknown, {}, User, {}, import("mongoose").DefaultSchemaOptions> & User & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    unbanUser(id: string, admin: User): Promise<import("mongoose").Document<unknown, {}, User, {}, import("mongoose").DefaultSchemaOptions> & User & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    warnUser(id: string, body: {
        reason?: string;
    }, admin: User): Promise<import("mongoose").Document<unknown, {}, User, {}, import("mongoose").DefaultSchemaOptions> & User & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    changeUserRole(id: string, changeRoleDto: ChangeRoleDto, admin: User): Promise<import("mongoose").Document<unknown, {}, User, {}, import("mongoose").DefaultSchemaOptions> & User & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    deletePost(id: string, body: {
        reason?: string;
    }, admin: User): Promise<{
        success: boolean;
    }>;
    getActivityLogs(page?: number, limit?: number, adminId?: string, activityType?: ActivityType): Promise<{
        logs: (import("../entities/activity-log.entity").ActivityLog & Required<{
            _id: import("mongoose").Types.ObjectId;
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
