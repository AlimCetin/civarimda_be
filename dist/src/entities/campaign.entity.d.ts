export declare class Campaign {
    id: string;
    userId: string;
    title: string;
    description: string;
    imageUrl: string | null;
    city: string;
    latitude: number | null;
    longitude: number | null;
    businessName: string;
    discountRate: string;
    maxClaims: number | null;
    currentClaims: number;
    startDate: Date | null;
    endDate: Date | null;
    hasCode: boolean;
    likes: string[];
    commentCount: number;
    createdAt: Date;
    updatedAt: Date;
    populateVirtuals(): void;
    toObject(distance?: number | null): this & {
        id: string;
        _id: string;
        createdBy: string;
        likes: string[];
        latitude: number | null;
        longitude: number | null;
        distance: number | null;
    };
}
