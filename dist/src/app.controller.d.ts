export declare class AppController {
    private readonly LATEST_VERSION;
    private readonly MIN_SUPPORTED_VERSION;
    health(): {
        status: string;
        message: string;
    };
    root(): {
        message: string;
    };
    versionCheck(currentVersion?: string, platform?: string): {
        currentVersion: string;
        latestVersion: string;
        updateRequired: boolean;
        forceUpdate: boolean;
        message: string;
        androidStoreUrl: string;
        iosStoreUrl: string;
        platform: string;
    };
    private isUpdateRequired;
    private isForceUpdate;
}
