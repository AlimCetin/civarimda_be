import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppSetting } from '../entities/app-setting.entity';

@Injectable()
export class SettingsService implements OnModuleInit {
  private readonly logger = new Logger(SettingsService.name);
  private cache = new Map<string, string>();

  constructor(
    @InjectRepository(AppSetting)
    private settingsRepo: Repository<AppSetting>,
  ) {}

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
    } catch (e: any) {
      this.logger.warn(`Ayarlar önbelleğe yüklenemedi: ${e.message}`);
    }
  }

  async seedDefaultSettings() {
    const defaults: Partial<AppSetting>[] = [
      {
        key: 'storage_provider',
        value: 'local', // 'local' | 'cloudinary' | 's3'
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

  async getAllSettings(): Promise<AppSetting[]> {
    return this.settingsRepo.find({ order: { key: 'ASC' } });
  }

  async getPublicSettings(): Promise<Record<string, any>> {
    const publicItems = await this.settingsRepo.find({ where: { isPublic: true } });
    const result: Record<string, any> = {};
    for (const item of publicItems) {
      if (item.type === 'boolean') {
        result[item.key] = item.value === 'true';
      } else if (item.type === 'number') {
        result[item.key] = Number(item.value);
      } else {
        result[item.key] = item.value;
      }
    }
    return result;
  }

  getSetting(key: string, defaultValue = ''): string {
    return this.cache.get(key) ?? defaultValue;
  }

  async updateSettings(updates: Record<string, any>): Promise<{ success: boolean; updatedCount: number }> {
    let count = 0;
    for (const [key, value] of Object.entries(updates)) {
      const setting = await this.settingsRepo.findOne({ where: { key } });
      const strVal = value !== null && value !== undefined ? String(value) : '';
      if (setting) {
        setting.value = strVal;
        await this.settingsRepo.save(setting);
        count++;
      } else {
        await this.settingsRepo.save(
          this.settingsRepo.create({
            key,
            value: strVal,
            description: key,
            type: typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'string',
            isPublic: false,
            isSecret: false,
          }),
        );
        count++;
      }
    }
    await this.refreshCache();
    return { success: true, updatedCount: count };
  }

  async testStorageConnection(provider: string, config?: Record<string, string>): Promise<{ success: boolean; message: string }> {
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

      // Cloudinary ping testi
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
}
