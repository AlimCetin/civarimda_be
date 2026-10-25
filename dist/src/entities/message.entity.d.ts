export declare class Message {
    id: string;
    get _id(): string;
    set _id(val: string);
    conversationId: string;
    senderId: string;
    text: string;
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
