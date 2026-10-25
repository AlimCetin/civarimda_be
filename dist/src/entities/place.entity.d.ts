export declare class Place {
    id: string;
    userId: string;
    name: string;
    description: string;
    imageUrl: string | null;
    images: string[];
    city: string;
    latitude: number | null;
    longitude: number | null;
    businessName: string;
    category: string;
    address: string;
    phone: string;
    workingHours: string;
    entryFee: string;
    likes: string[];
    commentCount: number;
    createdAt: Date;
    updatedAt: Date;
    populateVirtuals(): void;
    toObject(distance?: number | null): this & {
        id: string;
        _id: string;
        title: string;
        createdBy: string;
        likes: string[];
        images: string[];
        latitude: number | null;
        longitude: number | null;
        distance: number | null;
    };
}
