import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { Repository } from 'typeorm';
import { StorageService } from '../common/storage/storage.service';
import { OtaChannel, OtaPlatform, OtaRelease } from '../entities/ota-release.entity';
import { CreateOtaReleaseDto, UpdateOtaReleaseDto } from './dto/ota-update.dto';

@Injectable()
export class OtaUpdatesService {
  private readonly logger = new Logger(OtaUpdatesService.name);
  private ephemeralKeyPair: { privateKey: string; publicKey: string } | null = null;

  constructor(
    @InjectRepository(OtaRelease)
    private readonly otaRepo: Repository<OtaRelease>,
    private readonly configService: ConfigService,
    private readonly storageService: StorageService,
  ) {}

  private getSigningKeys(): { privateKey: string; publicKey: string } {
    const envPrivate = this.configService.get<string>('OTA_SIGNING_PRIVATE_KEY');
    const envPublic = this.configService.get<string>('OTA_SIGNING_PUBLIC_KEY');
    if (envPrivate && envPublic) {
      return {
        privateKey: envPrivate.replace(/\\n/g, '\n'),
        publicKey: envPublic.replace(/\\n/g, '\n'),
      };
    }

    if (!this.ephemeralKeyPair) {
      this.logger.warn(
        'OTA_SIGNING_PRIVATE_KEY tanımlı değil; geçici RSA anahtar çifti üretildi. Production ortamında .env üzerinden sabit RSA anahtarı tanımlayın.',
      );
      this.ephemeralKeyPair = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      });
    }
    return this.ephemeralKeyPair;
  }

  getPublicKey(): string {
    return this.getSigningKeys().publicKey;
  }

  private signDigest(sha256Hex: string): string {
    const { privateKey } = this.getSigningKeys();
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(sha256Hex);
    sign.end();
    return `sig:${sign.sign(privateKey, 'base64')}`;
  }

  private isEligibleForRollout(rolloutPercentage: number, clientSeed?: string): boolean {
    if (rolloutPercentage >= 100) return true;
    if (rolloutPercentage <= 0) return false;
    if (!clientSeed) return true;
    const hash = crypto.createHash('sha256').update(clientSeed).digest();
    const bucket = hash.readUInt16BE(0) % 100;
    return bucket < rolloutPercentage;
  }

  /**
   * Yeni OTA bundle yükler, SHA-256 hash ve RSA-SHA256 imza üretir, Cloudflare R2/Local'a kaydeder.
   */
  async publishRelease(
    adminId: string,
    file: Express.Multer.File,
    dto: CreateOtaReleaseDto,
  ): Promise<OtaRelease> {
    if (!file) {
      throw new BadRequestException('OTA bundle dosyası zorunludur.');
    }

    const buffer = await fs.promises.readFile(file.path);
    const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');
    const rsaSignature = this.signDigest(fileHash);
    const stored = await this.storageService.uploadMulterFile(file);

    const release = this.otaRepo.create({
      platform: dto.platform,
      channel: dto.channel || 'production',
      targetAppVersion: dto.targetAppVersion.trim(),
      bundleUrl: stored.url,
      fileHash,
      rsaSignature,
      fileSizeBytes: String(stored.sizeBytes),
      releaseNotes: dto.releaseNotes.trim(),
      shouldForceUpdate: dto.shouldForceUpdate ?? false,
      rolloutPercentage: dto.rolloutPercentage ?? 100,
      isEnabled: true,
      isRollback: false,
      downloadCount: 0,
      publishedBy: adminId,
    });

    return this.otaRepo.save(release);
  }

  /**
   * Hot Updater protokolüyle uyumlu güncelleme kontrolü döndürür.
   */
  async checkForUpdate(params: {
    platform?: string;
    appVersion?: string;
    channel?: string;
    currentBundleId?: string;
    clientId?: string;
  }) {
    const platform: OtaPlatform = params.platform === 'ios' ? 'ios' : 'android';
    const channel: OtaChannel = params.channel === 'staging' ? 'staging' : 'production';
    const appVersion = params.appVersion?.trim() || '';

    if (!appVersion || !/^\d+\.\d+\.\d+$/.test(appVersion)) {
      return { data: null };
    }

    const latest = await this.otaRepo.findOne({
      where: {
        platform,
        channel,
        targetAppVersion: appVersion,
        isEnabled: true,
      },
      order: { createdAt: 'DESC' },
    });

    if (!latest) {
      return { data: null };
    }

    if (params.currentBundleId && params.currentBundleId === latest.id) {
      return { data: null };
    }

    if (!this.isEligibleForRollout(latest.rolloutPercentage, params.clientId || params.currentBundleId)) {
      return { data: null };
    }

    await this.otaRepo.increment({ id: latest.id }, 'downloadCount', 1);

    return {
      data: {
        bundleId: latest.id,
        status: latest.isRollback ? 'ROLLBACK' : 'UPDATE',
        shouldForceUpdate: latest.shouldForceUpdate,
        manifestUrl: `/api/ota/manifest/${latest.id}`,
        manifestFileHash: latest.rsaSignature,
        archiveUrl: latest.bundleUrl,
        assets: {
          'index.bundle': {
            url: latest.bundleUrl,
            size: Number(latest.fileSizeBytes),
            hash: latest.fileHash,
          },
        },
        filesUrl: null,
        channel: latest.channel,
        meta: {
          message: latest.releaseNotes,
          fileHash: latest.fileHash,
          signature: latest.rsaSignature,
        },
      },
    };
  }

  async getManifest(id: string) {
    const release = await this.otaRepo.findOne({ where: { id, isEnabled: true } });
    if (!release) {
      throw new NotFoundException('OTA manifest bulunamadı.');
    }
    return {
      bundleId: release.id,
      platform: release.platform,
      channel: release.channel,
      targetAppVersion: release.targetAppVersion,
      fileHash: release.fileHash,
      signature: release.rsaSignature,
      archiveUrl: release.bundleUrl,
      size: Number(release.fileSizeBytes),
      releaseNotes: release.releaseNotes,
    };
  }

  async findAllAdmin() {
    return this.otaRepo.find({ order: { createdAt: 'DESC' } });
  }

  async updateRelease(id: string, dto: UpdateOtaReleaseDto) {
    const release = await this.otaRepo.findOne({ where: { id } });
    if (!release) throw new NotFoundException('OTA sürümü bulunamadı.');

    if (dto.isEnabled !== undefined) release.isEnabled = dto.isEnabled;
    if (dto.shouldForceUpdate !== undefined) release.shouldForceUpdate = dto.shouldForceUpdate;
    if (dto.rolloutPercentage !== undefined) release.rolloutPercentage = dto.rolloutPercentage;
    if (dto.releaseNotes !== undefined) release.releaseNotes = dto.releaseNotes.trim();

    return this.otaRepo.save(release);
  }

  /**
   * Hatalı OTA sürümünü kapatır ve varsa bir önceki kararlı sürümü ROLLBACK bayrağıyla aktif tutar.
   */
  async rollbackRelease(id: string) {
    const target = await this.otaRepo.findOne({ where: { id } });
    if (!target) throw new NotFoundException('OTA sürümü bulunamadı.');

    target.isEnabled = false;
    await this.otaRepo.save(target);

    const previous = await this.otaRepo
      .createQueryBuilder('o')
      .where('o.platform = :platform', { platform: target.platform })
      .andWhere('o.channel = :channel', { channel: target.channel })
      .andWhere('o.targetAppVersion = :ver', { ver: target.targetAppVersion })
      .andWhere('o.id != :id', { id: target.id })
      .orderBy('o.createdAt', 'DESC')
      .getOne();

    if (previous) {
      previous.isEnabled = true;
      previous.isRollback = true;
      previous.shouldForceUpdate = true;
      await this.otaRepo.save(previous);
    }

    return {
      disabledId: target.id,
      restoredId: previous?.id || null,
    };
  }
}

