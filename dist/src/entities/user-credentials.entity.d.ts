export declare class UserCredentials {
    id: string;
    get _id(): string;
    set _id(val: string);
    userId: string;
    email: string;
    password: string;
    refreshToken: string | null;
    createdAt: Date;
    updatedAt: Date;
    generateIdAndHashPassword(): Promise<void>;
    hashPasswordOnUpdate(): Promise<void>;
    populateVirtuals(): void;
    comparePassword(candidatePassword: string): Promise<boolean>;
}
