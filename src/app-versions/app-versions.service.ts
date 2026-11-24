import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AppPlatform, AppVersion } from '../entities/app-version.entity';
import { CreateAppVersionDto, UpdateAppVersionDto } from './dto/app-version.dto';

function compareSemver(a: string, b: string): number {
  const aParts = a.split('.').map((n) => Number(n) || 0);
  const bParts = b.split('.').map((n) => Number(n) || 0);
  const len = Math.max(aParts.length, bParts.length);
  for (let i = 0; i < len; i++) {
    const av = aParts[i] || 0;
    const bv = bParts[i] || 0;
    if (av > bv) return 1;
    if (av < bv) return -1;
  }
  return 0;
}

@Injectable()
export class AppVersionsService implements OnModuleInit {
  constructor(
    @InjectRepository(AppVersion)
    private readonly versionRepo: Repository<AppVersion>,
  ) {}

  async onModuleInit() {
    const count = await this.versionRepo.count();
    if (count === 0) {
      await this.versionRepo.save(
        this.versionRepo.create({
          version: '1.0.3',
          platform: 'all',
          title: 'Civarımda v1.0.3',
          releaseNotes:
            '• Kuaför randevu ve fiyat listesi sistemi eklendi\n• Bölgesel haberler ve önemli duyurular eklendi\n• Güvenlik ve performans iyileştirmeleri yapıldı',
          forceUpdate: false,
          minSupportedVersion: '1.0.2',
          isActive: true,
        }),
      );
    }
  }

  async checkVersion(currentVersionRaw?: string, platformRaw?: string) {
    const currentVersion =
      currentVersionRaw && /^\d+\.\d+\.\d+$/.test(currentVersionRaw.trim())
        ? currentVersionRaw.trim()
        : '0.0.0';
    const platform: AppPlatform =
      platformRaw === 'android' || platformRaw === 'ios' ? platformRaw : 'all';

    const candidates = await this.versionRepo.find({
      where: {
        isActive: true,
        platform: In(platform === 'all' ? ['all'] : [platform, 'all']),
      },
      order: { createdAt: 'DESC' },
    });

    if (candidates.length === 0) {
      return {
        currentVersion,
        latestVersion: currentVersion,
        updateRequired: false,
        forceUpdate: false,
        title: 'Uygulamanız Güncel',
        message: 'Uygulamanız güncel.',
        releaseNotes: '',
        androidStoreUrl: 'https://play.google.com/store/apps/details?id=com.civarimda.app',
        iosStoreUrl: 'https://apps.apple.com/app/idYOUR_APP_ID',
        platform: platformRaw || 'unknown',
      };
    }

    // En yüksek semver sürümünü seç
    const latest = [...candidates].sort((a, b) => compareSemver(b.version, a.version))[0];
    const updateRequired = compareSemver(latest.version, currentVersion) > 0;
    const belowMinimum =
      !!latest.minSupportedVersion &&
      compareSemver(latest.minSupportedVersion, currentVersion) > 0;
    const forceUpdate = updateRequired && (latest.forceUpdate || belowMinimum);

    return {
      currentVersion,
      latestVersion: latest.version,
      minSupportedVersion: latest.minSupportedVersion,
      updateRequired,
      forceUpdate,
      title: latest.title,
      message: forceUpdate
        ? `Kritik güncelleme (${latest.version}) mevcut. Devam etmek için lütfen uygulamayı güncelleyin.`
        : updateRequired
          ? `Yeni sürüm ${latest.version} yayınlandı!`
          : 'Uygulamanız güncel.',
      releaseNotes: latest.releaseNotes,
      androidStoreUrl: latest.androidStoreUrl,
      iosStoreUrl: latest.iosStoreUrl,
      platform: platformRaw || 'unknown',
    };
  }

  async findAllAdmin() {
    return this.versionRepo.find({ order: { createdAt: 'DESC' } });
  }

  async create(adminId: string, dto: CreateAppVersionDto) {
    const entity = this.versionRepo.create({
      version: dto.version.trim(),
      platform: dto.platform || 'all',
      title: dto.title.trim(),
      releaseNotes: dto.releaseNotes.trim(),
      forceUpdate: dto.forceUpdate ?? false,
      minSupportedVersion: dto.minSupportedVersion ?? null,
      androidStoreUrl:
        dto.androidStoreUrl || 'https://play.google.com/store/apps/details?id=com.civarimda.app',
      iosStoreUrl: dto.iosStoreUrl || 'https://apps.apple.com/app/idYOUR_APP_ID',
      isActive: dto.isActive ?? true,
      publishedBy: adminId,
    });
    return this.versionRepo.save(entity);
  }

  async update(id: string, dto: UpdateAppVersionDto) {
    const item = await this.versionRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Sürüm kaydı bulunamadı.');

    if (dto.version !== undefined) item.version = dto.version.trim();
    if (dto.platform !== undefined) item.platform = dto.platform;
    if (dto.title !== undefined) item.title = dto.title.trim();
    if (dto.releaseNotes !== undefined) item.releaseNotes = dto.releaseNotes.trim();
    if (dto.forceUpdate !== undefined) item.forceUpdate = dto.forceUpdate;
    if (dto.minSupportedVersion !== undefined) item.minSupportedVersion = dto.minSupportedVersion;
    if (dto.androidStoreUrl !== undefined) item.androidStoreUrl = dto.androidStoreUrl;
    if (dto.iosStoreUrl !== undefined) item.iosStoreUrl = dto.iosStoreUrl;
    if (dto.isActive !== undefined) item.isActive = dto.isActive;

    return this.versionRepo.save(item);
  }

  async remove(id: string) {
    const item = await this.versionRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Sürüm kaydı bulunamadı.');
    await this.versionRepo.delete(id);
    return { success: true };
  }
}

