export declare enum AppealStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected"
}
export declare class Appeal {
    id: string;
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
    populateVirtuals(): void;
    toObject(): this & {
        id: string;
        _id: string;
        conversation: {
            senderId: string;
            message: string;
            createdAt: Date;
        }[];
    };
}
