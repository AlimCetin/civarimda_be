export declare class Notification {
    id: string;
    get _id(): string;
    userId: string;
    fromUserId: string;
    type: string;
    postId?: string | null;
    postOwnerName?: string | null;
    isFollowerNotification: boolean;
    read: boolean;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    generateId(): void;
    populateVirtuals(): void;
    toObject(): this & {
        _id: string;
    };
}
