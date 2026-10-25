import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { User } from '../entities/user.entity';

@Controller()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  /**
   * Mobil uygulamanın açılışta bakım modu, min sürüm ve acil duyuruları sorgulaması için genel açık uç.
   */
  @Get('settings/public')
  async getPublicSettings() {
    return this.settingsService.getPublicSettings();
  }

  /**
   * Admin paneli için tüm ayarları listeler.
   */
  @Get('admin/settings')
  @UseGuards(JwtAuthGuard)
  async getAllSettings(@CurrentUser() user: User) {
    if (!['admin', 'super_admin'].includes(user.role)) {
      throw new ForbiddenException('Bu işlem için yönetici yetkisi gereklidir.');
    }
    return this.settingsService.getAllSettings();
  }

  /**
   * Admin panelinden ayarları günceller (ör: bulut depolama sağlayıcısı, API anahtarları, bakım modu).
   */
  @Put('admin/settings')
  @UseGuards(JwtAuthGuard)
  async updateSettings(
    @Body() body: Record<string, any>,
    @CurrentUser() user: User,
  ) {
    if (!['admin', 'super_admin'].includes(user.role)) {
      throw new ForbiddenException('Bu işlem için yönetici yetkisi gereklidir.');
    }
    return this.settingsService.updateSettings(body);
  }

  /**
   * Cloudinary / AWS S3 / Local depolama bağlantı testi.
   */
  @Post('admin/settings/test-storage')
  @UseGuards(JwtAuthGuard)
  async testStorage(
    @Body() body: { provider: string; config?: Record<string, string> },
    @CurrentUser() user: User,
  ) {
    if (!['admin', 'super_admin'].includes(user.role)) {
      throw new ForbiddenException('Bu işlem için yönetici yetkisi gereklidir.');
    }
    return this.settingsService.testStorageConnection(body.provider, body.config);
  }
}
