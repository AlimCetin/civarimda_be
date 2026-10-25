export declare class Notification {
    id: string;
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
    toObject(): this & {
        id: string;
        _id: string;
    };
}
