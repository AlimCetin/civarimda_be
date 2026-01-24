import { Controller, Get, Query } from '@nestjs/common';

@Controller()
export class AppController {
  // Mevcut uygulama versiyonu - bu değeri güncellemeyi unutmayın!
  private readonly LATEST_VERSION = '1.0.0';
  private readonly MIN_SUPPORTED_VERSION = '1.0.0'; // Minimum desteklenen versiyon

  @Get('health')
  health() {
    return { status: 'OK', message: 'Tosyam API is running' };
  }

  @Get()
  root() {
    return { message: 'Welcome to Tosyam API v' + this.LATEST_VERSION };
  }

  /**
   * Uygulama versiyon kontrolü endpoint'i
   * GET /app/version-check?currentVersion=1.0.0&platform=android
   */
  @Get('app/version-check')
  versionCheck(
    @Query('currentVersion') currentVersion?: string,
    @Query('platform') platform?: string,
  ) {
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
      iosStoreUrl: 'https://apps.apple.com/app/idYOUR_APP_ID', // iOS App Store ID'nizi buraya ekleyin
      platform: platform || 'unknown',
    };
  }

  /**
   * Versiyon karşılaştırması - basit semver karşılaştırması
   */
  private isUpdateRequired(current: string): boolean {
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
      } else if (latestPart < currentPart) {
        return false;
      }
    }

    return false;
  }

  /**
   * Zorunlu güncelleme kontrolü - kritik güvenlik açıkları için
   */
  private isForceUpdate(current: string): boolean {
    if (!current) {
      return true; // Versiyon bilgisi yoksa güncelleme zorunlu
    }

    const currentParts = current.split('.').map(Number);
    const minParts = this.MIN_SUPPORTED_VERSION.split('.').map(Number);

    // Minimum desteklenen versiyondan eski ise zorunlu güncelleme
    for (let i = 0; i < Math.max(currentParts.length, minParts.length); i++) {
      const currentPart = currentParts[i] || 0;
      const minPart = minParts[i] || 0;

      if (currentPart < minPart) {
        return true;
      } else if (currentPart > minPart) {
        return false;
      }
    }

    return false;
  }
}
