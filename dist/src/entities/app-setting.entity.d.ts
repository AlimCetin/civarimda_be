export declare class AppSetting {
    key: string;
    value: string;
    description: string;
    type: 'string' | 'number' | 'boolean' | 'json';
    isSecret: boolean;
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
}
