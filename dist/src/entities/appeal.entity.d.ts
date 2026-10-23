export declare enum AppealStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected"
}
export declare class Appeal {
    id: string;
    get _id(): string;
    userId: string;
    banLogId: string;
    reason: string;
    status: AppealStatus;
    reviewedBy: string | null;
    reviewedAt: Date | null;
    adminResponse: string;
    conversation: Array<{
        senderId: string;
        message: string;
        createdAt: Date;
    }>;
    createdAt: Date;
    updatedAt: Date;
    generateId(): void;
    populateVirtuals(): void;
    toObject(): this & {
        _id: string;
        conversation: {
            senderId: string;
            message: string;
            createdAt: Date;
        }[];
    };
}
