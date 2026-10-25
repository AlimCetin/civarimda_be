export declare enum AdType {
    IMAGE = "image",
    VIDEO = "video"
}
export declare enum AdStatus {
    ACTIVE = "active",
    PAUSED = "paused",
    EXPIRED = "expired",
    DRAFT = "draft"
}
export declare class Ad {
    id: string;
    title: string;
    type: AdType;
    mediaUrl: string;
    linkUrl: string;
    description: string;
    status: AdStatus;
    startDate: Date;
    endDate: Date;
    clickCount: number;
    viewCount: number;
    impressionCount: number;
    createdBy: string | null;
    maxImpressions: number;
    budget: number;
    spentAmount: number;
    createdAt: Date;
    updatedAt: Date;
    toObject(): this & {
        id: string;
        _id: string;
    };
}
