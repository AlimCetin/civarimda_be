import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { User } from '../entities/user.entity';
import { AppVersionsService } from './app-versions.service';
import { CreateAppVersionDto, UpdateAppVersionDto } from './dto/app-version.dto';

@Controller()
export class AppVersionsController {
  constructor(private readonly appVersionsService: AppVersionsService) {}

  @Get('app/version-check')
  async versionCheck(
    @Query('currentVersion') currentVersion?: string,
    @Query('platform') platform?: string,
  ) {
    return this.appVersionsService.checkVersion(currentVersion, platform);
  }

  @Get('admin/app-versions')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async findAllAdmin() {
    return this.appVersionsService.findAllAdmin();
  }

  @Post('admin/app-versions')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async create(@Body() dto: CreateAppVersionDto, @CurrentUser() admin: User) {
    return this.appVersionsService.create(admin.id, dto);
  }

  @Put('admin/app-versions/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAppVersionDto,
  ) {
    return this.appVersionsService.update(id, dto);
  }

  @Delete('admin/app-versions/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.appVersionsService.remove(id);
  }
}

