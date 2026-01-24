import { Document } from 'mongoose';
export declare enum ReportType {
    USER = "user",
    POST = "post",
    COMMENT = "comment",
    MESSAGE = "message"
}
export declare enum ReportReason {
    SPAM = "spam",
    HARASSMENT = "harassment",
    INAPPROPRIATE_CONTENT = "inappropriate_content",
    COPYRIGHT = "copyright",
    FAKE_NEWS = "fake_news",
    HATE_SPEECH = "hate_speech",
    OTHER = "other"
}
export declare enum ReportStatus {
    PENDING = "pending",
    IN_REVIEW = "in_review",
    RESOLVED = "resolved",
    REJECTED = "rejected"
}
export declare enum ReportPriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    URGENT = "urgent"
}
export declare class Report extends Document {
    reporterId: string;
    reportedId: string;
    type: ReportType;
    reason: ReportReason;
    description: string;
    status: ReportStatus;
    priority: ReportPriority;
    reviewedBy: string;
    reviewedAt: Date;
    adminNote: string;
    reportCount: number;
}
export declare const ReportSchema: import("mongoose").Schema<Report, import("mongoose").Model<Report, any, any, any, (Document<unknown, any, Report, any, import("mongoose").DefaultSchemaOptions> & Report & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}) | (Document<unknown, any, Report, any, import("mongoose").DefaultSchemaOptions> & Report & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}), any, Report>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Report, Document<unknown, {}, Report, {
    id: string;
}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Report & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    _id?: import("mongoose").SchemaDefinitionProperty<import("mongoose").Types.ObjectId, Report, Document<unknown, {}, Report, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Report & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    type?: import("mongoose").SchemaDefinitionProperty<ReportType, Report, Document<unknown, {}, Report, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Report & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    description?: import("mongoose").SchemaDefinitionProperty<string, Report, Document<unknown, {}, Report, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Report & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    reporterId?: import("mongoose").SchemaDefinitionProperty<string, Report, Document<unknown, {}, Report, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Report & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    reportedId?: import("mongoose").SchemaDefinitionProperty<string, Report, Document<unknown, {}, Report, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Report & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    reason?: import("mongoose").SchemaDefinitionProperty<ReportReason, Report, Document<unknown, {}, Report, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Report & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<ReportStatus, Report, Document<unknown, {}, Report, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Report & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    priority?: import("mongoose").SchemaDefinitionProperty<ReportPriority, Report, Document<unknown, {}, Report, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Report & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    reviewedBy?: import("mongoose").SchemaDefinitionProperty<string, Report, Document<unknown, {}, Report, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Report & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    reviewedAt?: import("mongoose").SchemaDefinitionProperty<Date, Report, Document<unknown, {}, Report, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Report & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    adminNote?: import("mongoose").SchemaDefinitionProperty<string, Report, Document<unknown, {}, Report, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Report & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    reportCount?: import("mongoose").SchemaDefinitionProperty<number, Report, Document<unknown, {}, Report, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Report & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Report>;
