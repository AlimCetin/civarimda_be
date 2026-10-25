import { SettingsService } from './settings.service';
import { User } from '../entities/user.entity';
export declare class SettingsController {
    private readonly settingsService;
    constructor(settingsService: SettingsService);
    getPublicSettings(): Promise<Record<string, any>>;
    getAllSettings(user: User): Promise<import("../entities/app-setting.entity").AppSetting[]>;
    updateSettings(body: Record<string, any>, user: User): Promise<{
        success: boolean;
        updatedCount: number;
    }>;
    testStorage(body: {
        provider: string;
        config?: Record<string, string>;
    }, user: User): Promise<{
        success: boolean;
        message: string;
    }>;
}
