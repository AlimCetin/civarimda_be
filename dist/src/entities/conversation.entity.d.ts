export declare class Conversation {
    id: string;
    participants: string[];
    lastMessage: string | null;
    lastMessageAt: Date;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    populateVirtuals(): void;
    toObject(): this & {
        id: string;
        _id: string;
        participants: string[];
    };
}
