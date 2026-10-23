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
            id: string;
            _id: string;
            fullName: string;
            avatar: string | null;
            bio: string;
            role: string;
            warningCount: number;
            bannedUntil: Date | null;
            isPermanentlyBanned: boolean;
            followerCount: number;
            followingCount: number;
            isVerified: boolean;
            createdAt: Date;
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
        _id: string;
        fullName: string;
        avatar: string | null;
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
            id: string;
            adminId: string;
            activityType: ActivityType;
            targetUserId: string | null;
            targetPostId: string | null;
            description: string;
            metadata: Record<string, any>;
            admin: {
                id: string;
                fullName: string;
                avatar: string | null;
            } | null;
            createdAt: Date;
        }[];
        createdAt: Date;
    }>;
    banUser(id: string, banUserDto: BanUserDto, admin: User): Promise<User>;
    unbanUser(id: string, admin: User): Promise<User>;
    warnUser(id: string, body: {
        reason?: string;
    }, admin: User): Promise<User>;
    changeUserRole(id: string, changeRoleDto: ChangeRoleDto, admin: User): Promise<User>;
    deletePost(id: string, body: {
        reason?: string;
    }, admin: User): Promise<{
        success: boolean;
    }>;
    getActivityLogs(page?: number, limit?: number, adminId?: string, activityType?: ActivityType): Promise<{
        logs: {
            id: string;
            _id: string;
            adminId: string;
            activityType: ActivityType;
            targetUserId: string | null;
            targetPostId: string | null;
            description: string;
            metadata: Record<string, any>;
            admin: {
                id: string;
                _id: string;
                fullName: string;
                avatar: string | null;
                role: string;
            } | null;
            targetUser: {
                id: string;
                _id: string;
                fullName: string;
                avatar: string | null;
            } | null;
            createdAt: Date;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            hasMore: boolean;
        };
    }>;
}
