import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { ActivityLog, ActivityType } from '../entities/activity-log.entity';
import { Post } from '../entities/post.entity';
import { BanUserDto } from './dto/ban-user.dto';
import { ChangeRoleDto } from './dto/change-role.dto';
export declare class AdminService {
    private userRepository;
    private activityLogRepository;
    private postRepository;
    constructor(userRepository: Repository<User>, activityLogRepository: Repository<ActivityLog>, postRepository: Repository<Post>);
    getDashboardStatistics(): Promise<{
        totalUsers: number;
        newUsersToday: number;
        newUsersThisWeek: number;
        bannedUsers: number;
        warnedUsers: number;
    }>;
    getUsers(page?: number, limit?: number, search?: string, role?: string, isBanned?: boolean): Promise<{
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
    getUserById(userId: string): Promise<{
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
    banUser(targetUserId: string, adminId: string, banUserDto: BanUserDto): Promise<User>;
    unbanUser(targetUserId: string, adminId: string): Promise<User>;
    warnUser(targetUserId: string, adminId: string, reason?: string): Promise<User>;
    changeUserRole(targetUserId: string, adminId: string, changeRoleDto: ChangeRoleDto): Promise<User>;
    deletePost(postId: string, adminId: string, reason?: string): Promise<{
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
