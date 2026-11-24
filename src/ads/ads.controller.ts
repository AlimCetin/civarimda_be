import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { ModeratorGuard } from '../common/guards/moderator.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { User } from '../entities/user.entity';
import { AdsService } from './ads.service';
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';
import {
  CreateBusinessAdDto,
  CreatePaidBusinessAdDto,
  PurchaseAdPackageDto,
} from './dto/business-ad.dto';
import { CreateAdPackageDto, UpdateAdPackageDto } from './dto/ad-package.dto';
import { AdStatus } from '../entities/ad.entity';

@Controller('ads')
export class AdsController {
  constructor(private adsService: AdsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  async create(@Body() createAdDto: CreateAdDto, @CurrentUser() admin: User) {
    return this.adsService.create(createAdDto, admin.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  async findAll(
    @Query('status') status?: AdStatus,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number = 20,
  ) {
    return this.adsService.findAll(status, page, limit);
  }

  @Get('active')
  @UseGuards(JwtAuthGuard)
  async getActiveAds(@Query('city') city?: string) {
    return this.adsService.getActiveAds(city);
  }

  @Get('packages')
  async getPackages() {
    return this.adsService.getPackages();
  }

  @Get('packages/all')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getAllPackagesAdmin() {
    return this.adsService.getAllPackagesAdmin();
  }

  @Post('packages')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async createPackage(@Body() dto: CreateAdPackageDto) {
    return this.adsService.createPackage(dto);
  }

  @Put('packages/:packageId')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async updatePackage(
    @Param('packageId') packageId: string,
    @Body() dto: UpdateAdPackageDto,
  ) {
    return this.adsService.updatePackage(packageId, dto);
  }

  @Delete('packages/:packageId')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async deletePackage(@Param('packageId') packageId: string) {
    return this.adsService.deletePackage(packageId);
  }

  @Get('my-ads')
  @UseGuards(JwtAuthGuard)
  async getMyBusinessAds(@CurrentUser() user: User) {
    return this.adsService.getMyBusinessAds(user.id);
  }

  @Post('business/free')
  @UseGuards(JwtAuthGuard)
  async createFreeBusinessAd(
    @Body() dto: CreateBusinessAdDto,
    @CurrentUser() user: User,
  ) {
    return this.adsService.createFreeBusinessAd(user.id, dto);
  }

  @Post('packages/:packageId/purchase')
  @UseGuards(JwtAuthGuard)
  async purchasePackage(
    @Param('packageId') packageId: string,
    @Body() dto: PurchaseAdPackageDto,
    @CurrentUser() user: User,
  ) {
    return this.adsService.purchasePackage(user.id, packageId, dto);
  }

  @Post('business/paid')
  @UseGuards(JwtAuthGuard)
  async createPaidBusinessAd(
    @Body() dto: CreatePaidBusinessAdDto,
    @CurrentUser() user: User,
  ) {
    return this.adsService.createPaidBusinessAd(user.id, dto);
  }

  @Get('statistics')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getStatistics(@Query('adId') adId?: string) {
    return this.adsService.getStatistics(adId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async findOne(@Param('id') id: string) {
    return this.adsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async update(
    @Param('id') id: string,
    @Body() updateAdDto: UpdateAdDto,
    @CurrentUser() admin: User,
  ) {
    return this.adsService.update(id, updateAdDto, admin.id);
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async approveAd(@Param('id') id: string, @CurrentUser() admin: User) {
    return this.adsService.approveAd(id, admin.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async delete(@Param('id') id: string, @CurrentUser() admin: User) {
    return this.adsService.delete(id, admin.id);
  }

  @Post(':id/impression')
  @UseGuards(JwtAuthGuard)
  async recordImpression(@Param('id') id: string) {
    await this.adsService.recordImpression(id);
    return { success: true };
  }

  @Post(':id/click')
  @UseGuards(JwtAuthGuard)
  async recordClick(@Param('id') id: string) {
    await this.adsService.recordClick(id);
    return { success: true };
  }

  @Post(':id/view')
  @UseGuards(JwtAuthGuard)
  async recordView(@Param('id') id: string) {
    await this.adsService.recordView(id);
    return { success: true };
  }
}

