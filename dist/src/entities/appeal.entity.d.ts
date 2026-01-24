import { Document } from 'mongoose';
export declare enum AppealStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected"
}
export declare class Appeal extends Document {
    userId: string;
    banLogId: string;
    reason: string;
    status: AppealStatus;
    reviewedBy: string;
    reviewedAt: Date;
    adminResponse: string;
    conversation: Array<{
        senderId: string;
        message: string;
        createdAt: Date;
    }>;
}
export declare const AppealSchema: import("mongoose").Schema<Appeal, import("mongoose").Model<Appeal, any, any, any, (Document<unknown, any, Appeal, any, import("mongoose").DefaultSchemaOptions> & Appeal & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}) | (Document<unknown, any, Appeal, any, import("mongoose").DefaultSchemaOptions> & Appeal & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}), any, Appeal>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Appeal, Document<unknown, {}, Appeal, {
    id: string;
}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Appeal & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    _id?: import("mongoose").SchemaDefinitionProperty<import("mongoose").Types.ObjectId, Appeal, Document<unknown, {}, Appeal, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Appeal & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    userId?: import("mongoose").SchemaDefinitionProperty<string, Appeal, Document<unknown, {}, Appeal, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Appeal & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    reason?: import("mongoose").SchemaDefinitionProperty<string, Appeal, Document<unknown, {}, Appeal, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Appeal & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<AppealStatus, Appeal, Document<unknown, {}, Appeal, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Appeal & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    reviewedBy?: import("mongoose").SchemaDefinitionProperty<string, Appeal, Document<unknown, {}, Appeal, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Appeal & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    reviewedAt?: import("mongoose").SchemaDefinitionProperty<Date, Appeal, Document<unknown, {}, Appeal, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Appeal & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    banLogId?: import("mongoose").SchemaDefinitionProperty<string, Appeal, Document<unknown, {}, Appeal, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Appeal & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    adminResponse?: import("mongoose").SchemaDefinitionProperty<string, Appeal, Document<unknown, {}, Appeal, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Appeal & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    conversation?: import("mongoose").SchemaDefinitionProperty<{
        senderId: string;
        message: string;
        createdAt: Date;
    }[], Appeal, Document<unknown, {}, Appeal, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Appeal & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Appeal>;
