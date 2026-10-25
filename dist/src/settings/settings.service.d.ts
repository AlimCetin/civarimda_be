import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AppSetting } from '../entities/app-setting.entity';
export declare class SettingsService implements OnModuleInit {
    private settingsRepo;
    private readonly logger;
    private cache;
    constructor(settingsRepo: Repository<AppSetting>);
    onModuleInit(): Promise<void>;
    refreshCache(): Promise<void>;
    seedDefaultSettings(): Promise<void>;
    getAllSettings(): Promise<AppSetting[]>;
    getPublicSettings(): Promise<Record<string, any>>;
    getSetting(key: string, defaultValue?: string): string;
    updateSettings(updates: Record<string, any>): Promise<{
        success: boolean;
        updatedCount: number;
    }>;
    testStorageConnection(provider: string, config?: Record<string, string>): Promise<{
        success: boolean;
        message: string;
    }>;
}
