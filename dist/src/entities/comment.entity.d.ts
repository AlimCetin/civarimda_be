export declare class Comment {
    id: string;
    get _id(): string;
    set _id(val: string);
    postId: string;
    userId: string;
    text: string;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    generateId(): void;
    populateVirtuals(): void;
    toObject(): this & {
        _id: string;
    };
}
