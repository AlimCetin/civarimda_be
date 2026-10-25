export declare class Comment {
    id: string;
    postId: string;
    userId: string;
    text: string;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    toObject(): this & {
        id: string;
        _id: string;
    };
}
