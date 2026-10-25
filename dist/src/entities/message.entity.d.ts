export declare class Message {
    id: string;
    conversationId: string;
    senderId: string;
    text: string;
    read: boolean;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    toObject(): this & {
        id: string;
        _id: string;
    };
}
