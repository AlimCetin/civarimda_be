export declare class Post {
    id: string;
    get _id(): string;
    set _id(val: string);
    userId: string;
    image: string | null;
    video?: string | null;
    caption: string;
    likes: string[];
    commentCount: number;
    isHidden: boolean;
    isPrivate: boolean;
    hiddenFromFollowers: string[];
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    generateId(): void;
    populateVirtuals(): void;
    toObject(): this & {
        _id: string;
        likes: string[];
        hiddenFromFollowers: string[];
    };
}
