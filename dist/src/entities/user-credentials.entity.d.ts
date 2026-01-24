import { Document, Types } from 'mongoose';
export declare class UserCredentials extends Document {
    userId: Types.ObjectId;
    email: string;
    password: string;
    refreshToken: string;
    comparePassword(candidatePassword: string): Promise<boolean>;
}
export declare const UserCredentialsSchema: import("mongoose").Schema<UserCredentials, import("mongoose").Model<UserCredentials, any, any, any, (Document<unknown, any, UserCredentials, any, import("mongoose").DefaultSchemaOptions> & UserCredentials & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}) | (Document<unknown, any, UserCredentials, any, import("mongoose").DefaultSchemaOptions> & UserCredentials & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}), any, UserCredentials>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, UserCredentials, Document<unknown, {}, UserCredentials, {
    id: string;
}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<UserCredentials & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    _id?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, UserCredentials, Document<unknown, {}, UserCredentials, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<UserCredentials & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    userId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, UserCredentials, Document<unknown, {}, UserCredentials, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<UserCredentials & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    email?: import("mongoose").SchemaDefinitionProperty<string, UserCredentials, Document<unknown, {}, UserCredentials, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<UserCredentials & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    password?: import("mongoose").SchemaDefinitionProperty<string, UserCredentials, Document<unknown, {}, UserCredentials, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<UserCredentials & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    refreshToken?: import("mongoose").SchemaDefinitionProperty<string, UserCredentials, Document<unknown, {}, UserCredentials, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<UserCredentials & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    comparePassword?: import("mongoose").SchemaDefinitionProperty<(candidatePassword: string) => Promise<boolean>, UserCredentials, Document<unknown, {}, UserCredentials, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<UserCredentials & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, UserCredentials>;
