import { Document } from 'mongoose';
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
export declare class ActivityLog extends Document {
    adminId: string;
    activityType: ActivityType;
    targetUserId: string;
    targetPostId: string;
    targetReportId: string;
    targetAdId: string;
    description: string;
    metadata: Record<string, any>;
}
export declare const ActivityLogSchema: import("mongoose").Schema<ActivityLog, import("mongoose").Model<ActivityLog, any, any, any, (Document<unknown, any, ActivityLog, any, import("mongoose").DefaultSchemaOptions> & ActivityLog & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}) | (Document<unknown, any, ActivityLog, any, import("mongoose").DefaultSchemaOptions> & ActivityLog & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}), any, ActivityLog>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ActivityLog, Document<unknown, {}, ActivityLog, {
    id: string;
}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<ActivityLog & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    _id?: import("mongoose").SchemaDefinitionProperty<import("mongoose").Types.ObjectId, ActivityLog, Document<unknown, {}, ActivityLog, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<ActivityLog & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    description?: import("mongoose").SchemaDefinitionProperty<string, ActivityLog, Document<unknown, {}, ActivityLog, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<ActivityLog & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    adminId?: import("mongoose").SchemaDefinitionProperty<string, ActivityLog, Document<unknown, {}, ActivityLog, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<ActivityLog & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    activityType?: import("mongoose").SchemaDefinitionProperty<ActivityType, ActivityLog, Document<unknown, {}, ActivityLog, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<ActivityLog & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    targetUserId?: import("mongoose").SchemaDefinitionProperty<string, ActivityLog, Document<unknown, {}, ActivityLog, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<ActivityLog & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    targetPostId?: import("mongoose").SchemaDefinitionProperty<string, ActivityLog, Document<unknown, {}, ActivityLog, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<ActivityLog & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    targetReportId?: import("mongoose").SchemaDefinitionProperty<string, ActivityLog, Document<unknown, {}, ActivityLog, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<ActivityLog & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    targetAdId?: import("mongoose").SchemaDefinitionProperty<string, ActivityLog, Document<unknown, {}, ActivityLog, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<ActivityLog & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    metadata?: import("mongoose").SchemaDefinitionProperty<Record<string, any>, ActivityLog, Document<unknown, {}, ActivityLog, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<ActivityLog & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, ActivityLog>;
