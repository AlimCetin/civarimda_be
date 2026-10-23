export declare class Conversation {
    id: string;
    get _id(): string;
    participants: string[];
    lastMessage: string | null;
    lastMessageAt: Date;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    generateId(): void;
    populateVirtuals(): void;
    toObject(): this & {
        _id: string;
        participants: string[];
    };
}
