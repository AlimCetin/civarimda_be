import { Injectable, Logger, PayloadTooLargeException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { StoredMedia } from '../../entities/stored-media.entity';

export interface StoredMediaResult {
  url: string;
  provider: 'local' | 'r2';
  key: string;
  sizeBytes: number;
}

export interface StorageQuotaStatus {
  provider: 'local' | 'r2';
  usedBytes: number;
  quotaBytes: number;
  remainingBytes: number;
  usagePercent: number;
  fileCount: number;
  usedFormatted: string;
  quotaFormatted: string;
  remainingFormatted: string;
  isWarning: boolean;
  isFull: boolean;
}

// Varsayılan Cloudflare R2 ücretsiz depolama kotası: 10 GB
const DEFAULT_STORAGE_QUOTA_BYTES = 10 * 1024 * 1024 * 1024;

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(StoredMedia)
    private readonly mediaRepo: Repository<StoredMedia>,
  ) {}

  private getActiveProviderName(): 'local' | 'r2' {
    const provider = this.configService.get<string>('STORAGE_PROVIDER', 'local').toLowerCase();
    if (provider !== 'r2') return 'local';

    const hasR2Config =
      !!this.configService.get<string>('R2_ACCOUNT_ID') &&
      !!this.configService.get<string>('R2_ACCESS_KEY_ID') &&
      !!this.configService.get<string>('R2_SECRET_ACCESS_KEY') &&
      !!this.configService.get<string>('R2_BUCKET_NAME') &&
      !!this.configService.get<string>('R2_PUBLIC_URL');

    return hasR2Config ? 'r2' : 'local';
  }

  private getQuotaLimitBytes(): number {
    const raw = Number(
      this.configService.get<string>('STORAGE_QUOTA_BYTES', String(DEFAULT_STORAGE_QUOTA_BYTES)),
    );
    return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_STORAGE_QUOTA_BYTES;
  }

  private formatBytes(bytes: number): string {
    if (bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const idx = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
    const val = bytes / Math.pow(1024, idx);
    return `${val.toFixed(idx === 0 ? 0 : 2)} ${units[idx]}`;
  }

  /**
   * Aktif depolama sağlayıcısı için kullanılan, kalan ve yüzde kota bilgilerini döndürür.
   */
  async getQuotaStatus(): Promise<StorageQuotaStatus> {
    const provider = this.getActiveProviderName();
    const quotaBytes = this.getQuotaLimitBytes();

    const raw = await this.mediaRepo
      .createQueryBuilder('m')
      .select('COALESCE(SUM(CAST(m.sizeBytes AS BIGINT)), 0)', 'usedBytes')
      .addSelect('COUNT(m.id)', 'fileCount')
      .where('m.provider = :provider', { provider })
      .getRawOne<{ usedBytes: string; fileCount: string }>();

    const usedBytes = Math.max(0, Number(raw?.usedBytes || 0));
    const fileCount = Math.max(0, Number(raw?.fileCount || 0));
    const remainingBytes = Math.max(0, quotaBytes - usedBytes);
    const usagePercent = Math.min(100, Math.round((usedBytes / quotaBytes) * 10000) / 100);

    return {
      provider,
      usedBytes,
      quotaBytes,
      remainingBytes,
      usagePercent,
      fileCount,
      usedFormatted: this.formatBytes(usedBytes),
      quotaFormatted: this.formatBytes(quotaBytes),
      remainingFormatted: this.formatBytes(remainingBytes),
      isWarning: usagePercent >= 80,
      isFull: usedBytes >= quotaBytes,
    };
  }

  /**
   * Multer ile diske alınan dosyayı kota kontrolünden geçirir ve aktif sağlayıcıya (local/R2) kaydeder.
   */
  async uploadMulterFile(file: Express.Multer.File): Promise<StoredMediaResult> {
    const normalizedPath = file.path.replace(/\\/g, '/');
    const relativePath = normalizedPath.includes('uploads/')
      ? normalizedPath.substring(normalizedPath.indexOf('uploads/'))
      : normalizedPath;

    const stat = await fs.promises.stat(file.path);
    const sizeBytes = file.size || stat.size || 0;
    const provider = this.getActiveProviderName();
    const quota = await this.getQuotaStatus();

    if (quota.usedBytes + sizeBytes > quota.quotaBytes) {
      fs.unlink(file.path, () => {});
      throw new PayloadTooLargeException(
        `Depolama kotası doldu (${quota.usedFormatted} / ${quota.quotaFormatted}). Yeni medya yüklenemez.`,
      );
    }

    if (provider === 'local') {
      const url = `/${relativePath}`;
      await this.mediaRepo.save(
        this.mediaRepo.create({
          key: relativePath,
          provider: 'local',
          mimeType: file.mimetype || 'application/octet-stream',
          sizeBytes: String(sizeBytes),
          url,
        }),
      );
      return {
        url,
        provider: 'local',
        key: relativePath,
        sizeBytes,
      };
    }

    const accountId = this.configService.get<string>('R2_ACCOUNT_ID')!;
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID')!;
    const secretAccessKey = this.configService.get<string>('R2_SECRET_ACCESS_KEY')!;
    const bucketName = this.configService.get<string>('R2_BUCKET_NAME')!;
    const publicUrl = this.configService.get<string>('R2_PUBLIC_URL')!;

    const key = relativePath.replace(/^uploads\//, '');
    const fileBuffer = await fs.promises.readFile(file.path);

    await this.putObjectToR2({
      accountId,
      accessKeyId,
      secretAccessKey,
      bucketName,
      key,
      body: fileBuffer,
      contentType: file.mimetype || 'application/octet-stream',
    });

    // Buluta başarıyla yüklendikten sonra geçici yerel dosyayı temizle
    fs.unlink(file.path, () => {});

    const cleanPublicUrl = publicUrl.endsWith('/') ? publicUrl.slice(0, -1) : publicUrl;
    const url = `${cleanPublicUrl}/${key}`;

    await this.mediaRepo.save(
      this.mediaRepo.create({
        key,
        provider: 'r2',
        mimeType: file.mimetype || 'application/octet-stream',
        sizeBytes: String(sizeBytes),
        url,
      }),
    );

    return {
      url,
      provider: 'r2',
      key,
      sizeBytes,
    };
  }

  /**
   * Cloudflare R2 S3-uyumlu API'ye AWS SigV4 imzalı PUT isteği gönderir.
   */
  private async putObjectToR2(params: {
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
    key: string;
    body: Buffer;
    contentType: string;
  }): Promise<void> {
    const host = `${params.accountId}.r2.cloudflarestorage.com`;
    const endpoint = `https://${host}/${params.bucketName}/${params.key}`;
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);
    const region = 'auto';
    const service = 's3';

    const payloadHash = crypto.createHash('sha256').update(params.body).digest('hex');
    const canonicalUri = `/${params.bucketName}/${params.key
      .split('/')
      .map(encodeURIComponent)
      .join('/')}`;
    const canonicalHeaders =
      `content-type:${params.contentType}\n` +
      `host:${host}\n` +
      `x-amz-content-sha256:${payloadHash}\n` +
      `x-amz-date:${amzDate}\n`;
    const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';

    const canonicalRequest = [
      'PUT',
      canonicalUri,
      '',
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n');

    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      crypto.createHash('sha256').update(canonicalRequest).digest('hex'),
    ].join('\n');

    const hmac = (key: Buffer | string, data: string) =>
      crypto.createHmac('sha256', key).update(data).digest();

    const kDate = hmac(`AWS4${params.secretAccessKey}`, dateStamp);
    const kRegion = hmac(kDate, region);
    const kService = hmac(kRegion, service);
    const kSigning = hmac(kService, 'aws4_request');
    const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

    const authorization =
      `AWS4-HMAC-SHA256 Credential=${params.accessKeyId}/${credentialScope}, ` +
      `SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': params.contentType,
        'x-amz-content-sha256': payloadHash,
        'x-amz-date': amzDate,
        Authorization: authorization,
      },
      body: new Uint8Array(params.body),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Cloudflare R2 yükleme hatası (${response.status}): ${errorText}`);
    }
  }

  getLocalUploadsDir(): string {
    return path.join(process.cwd(), 'uploads');
  }
}

