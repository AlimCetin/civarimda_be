export declare class User {
    id: string;
    fullName: string;
    avatar: string | null;
    bio: string;
    followers: string[];
    following: string[];
    blockedUsers: string[];
    savedPosts: string[];
    isVerified: boolean;
    hideFollowers: boolean;
    hideFollowing: boolean;
    hiddenFollowers: string[];
    hiddenFollowing: string[];
    role: string;
    warningCount: number;
    bannedUntil: Date | null;
    isPermanentlyBanned: boolean;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    populateVirtuals(): void;
    toObject(): this & {
        id: string;
        _id: string;
        followers: string[];
        following: string[];
        blockedUsers: string[];
        savedPosts: string[];
        hiddenFollowers: string[];
        hiddenFollowing: string[];
    };
}
