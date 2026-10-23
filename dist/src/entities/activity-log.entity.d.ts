export declare enum ActivityType {
    USER_BANNED = "user_banned",
    USER_UNBANNED = "user_unbanned",
    USER_WARNED = "user_warned",
    POST_DELETED = "post_deleted",
    POST_HIDDEN = "post_hidden",
    REPORT_RESOLVED = "report_resolved",
    REPORT_REJECTED = "report_rejected",
    AD_CREATED = "ad_created",
    AD_UPDATED = "ad_updated",
    AD_DELETED = "ad_deleted",
    ROLE_CHANGED = "role_changed"
}
export declare class ActivityLog {
    id: string;
    get _id(): string;
    adminId: string;
    activityType: ActivityType;
    targetUserId: string | null;
    targetPostId: string | null;
    targetReportId: string | null;
    targetAdId: string | null;
    description: string;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    generateId(): void;
    populateVirtuals(): void;
    toObject(): this & {
        _id: string;
        metadata: Record<string, any>;
    };
}
