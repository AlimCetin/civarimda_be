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
import { AdStatus } from '../entities/ad.entity';

@Controller('ads')
export class AdsController {
  constructor(private adsService: AdsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  async create(@Body() createAdDto: CreateAdDto, @CurrentUser() admin: User) {
    return this.adsService.create(createAdDto, admin._id.toString());
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
  async getActiveAds() {
    return this.adsService.getActiveAds();
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
    return this.adsService.update(id, updateAdDto, admin._id.toString());
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async delete(@Param('id') id: string, @CurrentUser() admin: User) {
    return this.adsService.delete(id, admin._id.toString());
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

