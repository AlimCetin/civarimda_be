"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
let AppController = class AppController {
    LATEST_VERSION = '1.0.0';
    MIN_SUPPORTED_VERSION = '1.0.0';
    health() {
        return { status: 'OK', message: 'Tosyam API is running' };
    }
    versionCheck(currentVersion, platform) {
        const isUpdateRequired = this.isUpdateRequired(currentVersion || '0.0.0');
        const forceUpdate = this.isForceUpdate(currentVersion || '0.0.0');
        return {
            currentVersion: currentVersion || '0.0.0',
            latestVersion: this.LATEST_VERSION,
            updateRequired: isUpdateRequired,
            forceUpdate: forceUpdate,
            message: forceUpdate
                ? 'Kritik güncelleme mevcut. Lütfen uygulamayı hemen güncelleyin.'
                : isUpdateRequired
                    ? `Yeni versiyon ${this.LATEST_VERSION} mevcut. Önerilen özellikler ve hata düzeltmeleri için lütfen güncelleyin.`
                    : 'Uygulamanız güncel.',
            androidStoreUrl: 'https://play.google.com/store/apps/details?id=com.tosyam',
            iosStoreUrl: 'https://apps.apple.com/app/idYOUR_APP_ID',
            platform: platform || 'unknown',
        };
    }
    isUpdateRequired(current) {
        if (!current || current === this.LATEST_VERSION) {
            return false;
        }
        const currentParts = current.split('.').map(Number);
        const latestParts = this.LATEST_VERSION.split('.').map(Number);
        for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
            const currentPart = currentParts[i] || 0;
            const latestPart = latestParts[i] || 0;
            if (latestPart > currentPart) {
                return true;
            }
            else if (latestPart < currentPart) {
                return false;
            }
        }
        return false;
    }
    isForceUpdate(current) {
        if (!current) {
            return true;
        }
        const currentParts = current.split('.').map(Number);
        const minParts = this.MIN_SUPPORTED_VERSION.split('.').map(Number);
        for (let i = 0; i < Math.max(currentParts.length, minParts.length); i++) {
            const currentPart = currentParts[i] || 0;
            const minPart = minParts[i] || 0;
            if (currentPart < minPart) {
                return true;
            }
            else if (currentPart > minPart) {
                return false;
            }
        }
        return false;
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "health", null);
__decorate([
    (0, common_1.Get)('app/version-check'),
    __param(0, (0, common_1.Query)('currentVersion')),
    __param(1, (0, common_1.Query)('platform')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "versionCheck", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)()
], AppController);
//# sourceMappingURL=app.controller.js.map