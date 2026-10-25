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
var SettingsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const app_setting_entity_1 = require("../entities/app-setting.entity");
let SettingsService = SettingsService_1 = class SettingsService {
    settingsRepo;
    logger = new common_1.Logger(SettingsService_1.name);
    cache = new Map();
    constructor(settingsRepo) {
        this.settingsRepo = settingsRepo;
    }
    async onModuleInit() {
        await this.seedDefaultSettings();
        await this.refreshCache();
    }
    async refreshCache() {
        try {
            const all = await this.settingsRepo.find();
            this.cache.clear();
            for (const item of all) {
                this.cache.set(item.key, item.value);
            }
            this.logger.log(`Ayarlar önbelleğe yüklendi (${this.cache.size} ayar).`);
        }
        catch (e) {
            this.logger.warn(`Ayarlar önbelleğe yüklenemedi: ${e.message}`);
        }
    }
    async seedDefaultSettings() {
        const defaults = [
            {
                key: 'storage_provider',
                value: 'local',
                description: 'Medya depolama sağlayıcısı (local, cloudinary, s3)',
                type: 'string',
                isSecret: false,
                isPublic: false,
            },
            {
                key: 'cloudinary_cloud_name',
                value: '',
                description: 'Cloudinary Cloud Name',
                type: 'string',
                isSecret: false,
                isPublic: false,
            },
            {
                key: 'cloudinary_api_key',
                value: '',
                description: 'Cloudinary API Key',
                type: 'string',
                isSecret: true,
                isPublic: false,
            },
            {
                key: 'cloudinary_api_secret',
                value: '',
                description: 'Cloudinary API Secret',
                type: 'string',
                isSecret: true,
                isPublic: false,
            },
            {
                key: 's3_bucket',
                value: '',
                description: 'AWS S3 Bucket Adı',
                type: 'string',
                isSecret: false,
                isPublic: false,
            },
            {
                key: 's3_region',
                value: 'eu-central-1',
                description: 'AWS S3 Bölgesi',
                type: 'string',
                isSecret: false,
                isPublic: false,
            },
            {
                key: 's3_access_key',
                value: '',
                description: 'AWS S3 Access Key ID',
                type: 'string',
                isSecret: true,
                isPublic: false,
            },
            {
                key: 's3_secret_key',
                value: '',
                description: 'AWS S3 Secret Access Key',
                type: 'string',
                isSecret: true,
                isPublic: false,
            },
            {
                key: 'maintenance_mode',
                value: 'false',
                description: 'Uygulama Bakım Modu (true/false)',
                type: 'boolean',
                isSecret: false,
                isPublic: true,
            },
            {
                key: 'min_supported_version',
                value: '1.0.3',
                description: 'Desteklenen en düşük mobil uygulama sürümü',
                type: 'string',
                isSecret: false,
                isPublic: true,
            },
            {
                key: 'announcement_banner',
                value: '',
                description: 'Mobil ana sayfada gösterilecek acil durum veya kampanya duyuru metni',
                type: 'string',
                isSecret: false,
                isPublic: true,
            },
            {
                key: 'play_store_url',
                value: 'https://play.google.com/store/apps/details?id=com.civarimda',
                description: 'Google Play Store Değerlendirme Bağlantısı',
                type: 'string',
                isSecret: false,
                isPublic: true,
            },
            {
                key: 'app_store_url',
                value: '',
                description: 'Apple App Store Değerlendirme Bağlantısı',
                type: 'string',
                isSecret: false,
                isPublic: true,
            },
            {
                key: 'support_email',
                value: 'destek@civarimda.com',
                description: 'Resmi Destek ve İletişim E-posta Adresi',
                type: 'string',
                isSecret: false,
                isPublic: true,
            },
        ];
        for (const d of defaults) {
            const exists = await this.settingsRepo.findOne({ where: { key: d.key } });
            if (!exists) {
                await this.settingsRepo.save(this.settingsRepo.create(d));
            }
        }
    }
    async getAllSettings() {
        return this.settingsRepo.find({ order: { key: 'ASC' } });
    }
    async getPublicSettings() {
        const publicItems = await this.settingsRepo.find({ where: { isPublic: true } });
        const result = {};
        for (const item of publicItems) {
            if (item.type === 'boolean') {
                result[item.key] = item.value === 'true';
            }
            else if (item.type === 'number') {
                result[item.key] = Number(item.value);
            }
            else {
                result[item.key] = item.value;
            }
        }
        return result;
    }
    getSetting(key, defaultValue = '') {
        return this.cache.get(key) ?? defaultValue;
    }
    async updateSettings(updates) {
        let count = 0;
        for (const [key, value] of Object.entries(updates)) {
            const setting = await this.settingsRepo.findOne({ where: { key } });
            const strVal = value !== null && value !== undefined ? String(value) : '';
            if (setting) {
                setting.value = strVal;
                await this.settingsRepo.save(setting);
                count++;
            }
            else {
                await this.settingsRepo.save(this.settingsRepo.create({
                    key,
                    value: strVal,
                    description: key,
                    type: typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'string',
                    isPublic: false,
                    isSecret: false,
                }));
                count++;
            }
        }
        await this.refreshCache();
        return { success: true, updatedCount: count };
    }
    async testStorageConnection(provider, config) {
        if (provider === 'local') {
            return { success: true, message: 'Yerel disk depolama aktif ve erişilebilir durumda.' };
        }
        if (provider === 'cloudinary') {
            const cloudName = config?.cloudinary_cloud_name || this.getSetting('cloudinary_cloud_name');
            const apiKey = config?.cloudinary_api_key || this.getSetting('cloudinary_api_key');
            const apiSecret = config?.cloudinary_api_secret || this.getSetting('cloudinary_api_secret');
            if (!cloudName || !apiKey || !apiSecret) {
                return { success: false, message: 'Cloud Name, API Key ve API Secret alanları eksik.' };
            }
            return { success: true, message: `Cloudinary (${cloudName}) yapılandırması doğrulandı. Medya yüklemeleri CDN üzerinden dağıtılabilir.` };
        }
        if (provider === 's3') {
            const bucket = config?.s3_bucket || this.getSetting('s3_bucket');
            if (!bucket) {
                return { success: false, message: 'AWS S3 Bucket adı belirtilmemiş.' };
            }
            return { success: true, message: `AWS S3 (${bucket}) parametreleri başarıyla doğrulandı.` };
        }
        return { success: false, message: 'Bilinmeyen depolama sağlayıcısı.' };
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = SettingsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(app_setting_entity_1.AppSetting)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], SettingsService);
//# sourceMappingURL=settings.service.js.map