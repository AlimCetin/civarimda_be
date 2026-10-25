export declare class UserCredentials {
    id: string;
    userId: string;
    email: string;
    password: string;
    refreshToken: string | null;
    createdAt: Date;
    updatedAt: Date;
    hashPasswordOnInsert(): Promise<void>;
    hashPasswordOnUpdate(): Promise<void>;
    comparePassword(candidatePassword: string): Promise<boolean>;
}
