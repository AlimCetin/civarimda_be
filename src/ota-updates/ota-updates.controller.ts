import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import { extname, join } from 'path';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { User } from '../entities/user.entity';
import { OtaUpdatesService } from './ota-updates.service';
import { CreateOtaReleaseDto, UpdateOtaReleaseDto } from './dto/ota-update.dto';

const ALLOWED_OTA_EXTENSIONS = new Set(['.zip', '.br', '.gz', '.js', '.hbc', '.bundle']);

const otaMulterConfig = {
  storage: diskStorage({
    destination: (_req, _file, cb) => {
      const dir = join(process.cwd(), 'uploads/ota');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const ext = extname(file.originalname).toLowerCase();
      if (!ALLOWED_OTA_EXTENSIONS.has(ext)) {
        return cb(new Error('Geçersiz OTA bundle uzantısı.'), '');
      }
      cb(null, `ota-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
    },
  }),
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
  fileFilter: (_req: unknown, file: Express.Multer.File, cb: (err: Error | null, accept: boolean) => void) => {
    const ext = extname(file.originalname).toLowerCase();
    if (!ALLOWED_OTA_EXTENSIONS.has(ext)) {
      return cb(new BadRequestException('Yalnızca .zip, .br, .gz, .js, .hbc veya .bundle yüklenebilir.'), false);
    }
    cb(null, true);
  },
};

@Controller()
export class OtaUpdatesController {
  constructor(private readonly otaService: OtaUpdatesService) {}

  @Get('ota/public-key')
  getPublicKey() {
    return { publicKey: this.otaService.getPublicKey() };
  }

  @Get('ota/check')
  async checkForUpdate(
    @Query('platform') platform?: string,
    @Query('appVersion') appVersion?: string,
    @Query('channel') channel?: string,
    @Query('bundleId') currentBundleId?: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.otaService.checkForUpdate({
      platform,
      appVersion,
      channel,
      currentBundleId,
      clientId,
    });
  }

  @Get('ota/manifest/:id')
  async getManifest(@Param('id', ParseUUIDPipe) id: string) {
    return this.otaService.getManifest(id);
  }

  @Get('admin/ota')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async findAllAdmin() {
    return this.otaService.findAllAdmin();
  }

  @Post('admin/ota/upload')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(FileInterceptor('file', otaMulterConfig))
  async uploadRelease(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateOtaReleaseDto,
    @CurrentUser() admin: User,
  ) {
    return this.otaService.publishRelease(admin.id, file, dto);
  }

  @Patch('admin/ota/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async updateRelease(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOtaReleaseDto,
  ) {
    return this.otaService.updateRelease(id, dto);
  }

  @Post('admin/ota/:id/rollback')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async rollbackRelease(@Param('id', ParseUUIDPipe) id: string) {
    return this.otaService.rollbackRelease(id);
  }
}

