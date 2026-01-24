import { Document } from 'mongoose';
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
export declare class Ad extends Document {
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
    createdBy: string;
    maxImpressions: number;
    budget: number;
    spentAmount: number;
}
export declare const AdSchema: import("mongoose").Schema<Ad, import("mongoose").Model<Ad, any, any, any, (Document<unknown, any, Ad, any, import("mongoose").DefaultSchemaOptions> & Ad & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}) | (Document<unknown, any, Ad, any, import("mongoose").DefaultSchemaOptions> & Ad & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}), any, Ad>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Ad, Document<unknown, {}, Ad, {
    id: string;
}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Ad & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    _id?: import("mongoose").SchemaDefinitionProperty<import("mongoose").Types.ObjectId, Ad, Document<unknown, {}, Ad, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Ad & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    type?: import("mongoose").SchemaDefinitionProperty<AdType, Ad, Document<unknown, {}, Ad, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Ad & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    description?: import("mongoose").SchemaDefinitionProperty<string, Ad, Document<unknown, {}, Ad, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Ad & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<AdStatus, Ad, Document<unknown, {}, Ad, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Ad & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    title?: import("mongoose").SchemaDefinitionProperty<string, Ad, Document<unknown, {}, Ad, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Ad & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    mediaUrl?: import("mongoose").SchemaDefinitionProperty<string, Ad, Document<unknown, {}, Ad, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Ad & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    linkUrl?: import("mongoose").SchemaDefinitionProperty<string, Ad, Document<unknown, {}, Ad, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Ad & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    startDate?: import("mongoose").SchemaDefinitionProperty<Date, Ad, Document<unknown, {}, Ad, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Ad & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    endDate?: import("mongoose").SchemaDefinitionProperty<Date, Ad, Document<unknown, {}, Ad, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Ad & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    clickCount?: import("mongoose").SchemaDefinitionProperty<number, Ad, Document<unknown, {}, Ad, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Ad & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    viewCount?: import("mongoose").SchemaDefinitionProperty<number, Ad, Document<unknown, {}, Ad, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Ad & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    impressionCount?: import("mongoose").SchemaDefinitionProperty<number, Ad, Document<unknown, {}, Ad, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Ad & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    createdBy?: import("mongoose").SchemaDefinitionProperty<string, Ad, Document<unknown, {}, Ad, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Ad & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    maxImpressions?: import("mongoose").SchemaDefinitionProperty<number, Ad, Document<unknown, {}, Ad, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Ad & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    budget?: import("mongoose").SchemaDefinitionProperty<number, Ad, Document<unknown, {}, Ad, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Ad & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    spentAmount?: import("mongoose").SchemaDefinitionProperty<number, Ad, Document<unknown, {}, Ad, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Ad & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Ad>;
