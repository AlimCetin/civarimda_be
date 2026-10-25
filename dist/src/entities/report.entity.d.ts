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
export declare class Report {
    id: string;
    get _id(): string;
    set _id(val: string);
    reporterId: string;
    reportedId: string;
    type: ReportType;
    reason: ReportReason;
    description: string;
    status: ReportStatus;
    priority: ReportPriority;
    reviewedBy: string | null;
    reviewedAt: Date | null;
    adminNote: string;
    reportCount: number;
    createdAt: Date;
    updatedAt: Date;
    generateId(): void;
    populateVirtuals(): void;
    toObject(): this & {
        _id: string;
    };
}
