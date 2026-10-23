import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ad, AdStatus } from '../entities/ad.entity';
import { ActivityLog, ActivityType } from '../entities/activity-log.entity';
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';
import { isValidId } from '../common/utils/id.util';

@Injectable()
export class AdsService {
  constructor(
    @InjectRepository(Ad) private adRepository: Repository<Ad>,
    @InjectRepository(ActivityLog) private activityLogRepository: Repository<ActivityLog>,
  ) {}

  async create(createAdDto: CreateAdDto, adminId: string) {
    const startDate = new Date(createAdDto.startDate);
    const endDate = new Date(createAdDto.endDate);

    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    const ad = this.adRepository.create({
      ...createAdDto,
      startDate,
      endDate,
      status: createAdDto.status || AdStatus.DRAFT,
      createdBy: adminId,
      clickCount: 0,
      viewCount: 0,
      impressionCount: 0,
      spentAmount: 0,
    });
    await this.adRepository.save(ad);

    const log = this.activityLogRepository.create({
      adminId,
      activityType: ActivityType.AD_CREATED,
      targetAdId: ad.id,
      description: `Ad created: ${ad.title}`,
      metadata: { adId: ad.id },
    });
    await this.activityLogRepository.save(log);

    return ad;
  }

  async findAll(status?: AdStatus, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const maxLimit = Math.min(limit, 100);

    const query = this.adRepository.createQueryBuilder('ad');

    if (status) {
      query.andWhere('ad.status = :status', { status });
    }

    const [ads, total] = await query
      .orderBy('ad.createdAt', 'DESC')
      .skip(skip)
      .take(maxLimit)
      .getManyAndCount();

    return {
      ads: ads.map((ad) => ({
        id: ad.id,
        _id: ad.id,
        title: ad.title,
        type: ad.type,
        mediaUrl: ad.mediaUrl,
        linkUrl: ad.linkUrl,
        description: ad.description || '',
        status: ad.status,
        startDate: ad.startDate,
        endDate: ad.endDate,
        clickCount: ad.clickCount || 0,
        viewCount: ad.viewCount || 0,
        impressionCount: ad.impressionCount || 0,
        createdBy: ad.createdBy,
        maxImpressions: ad.maxImpressions || 0,
        budget: Number(ad.budget) || 0,
        spentAmount: Number(ad.spentAmount) || 0,
        createdAt: ad.createdAt,
      })),
      pagination: {
        page,
        limit: maxLimit,
        total,
        hasMore: skip + ads.length < total,
      },
    };
  }

  async getActiveAds() {
    const now = new Date();
    const ads = await this.adRepository
      .createQueryBuilder('ad')
      .where('ad.status = :status', { status: AdStatus.ACTIVE })
      .andWhere('ad.startDate <= :now AND ad.endDate >= :now', { now })
      .andWhere('(ad.maxImpressions = 0 OR ad.impressionCount < ad.maxImpressions)')
      .getMany();

    return ads.map((ad) => ({
      id: ad.id,
      _id: ad.id,
      title: ad.title,
      type: ad.type,
      mediaUrl: ad.mediaUrl,
      linkUrl: ad.linkUrl,
      description: ad.description || '',
      status: ad.status,
      startDate: ad.startDate,
      endDate: ad.endDate,
      clickCount: ad.clickCount || 0,
      viewCount: ad.viewCount || 0,
      impressionCount: ad.impressionCount || 0,
      createdBy: ad.createdBy,
      maxImpressions: ad.maxImpressions || 0,
      budget: Number(ad.budget) || 0,
      spentAmount: Number(ad.spentAmount) || 0,
      createdAt: ad.createdAt,
    }));
  }

  async findOne(adId: string) {
    if (!isValidId(adId)) {
      throw new BadRequestException('Invalid ad ID format');
    }

    const ad = await this.adRepository.findOne({ where: { id: adId } });
    if (!ad) {
      throw new NotFoundException('Ad not found');
    }

    return {
      id: ad.id,
      _id: ad.id,
      title: ad.title,
      type: ad.type,
      mediaUrl: ad.mediaUrl,
      linkUrl: ad.linkUrl,
      description: ad.description || '',
      status: ad.status,
      startDate: ad.startDate,
      endDate: ad.endDate,
      clickCount: ad.clickCount || 0,
      viewCount: ad.viewCount || 0,
      impressionCount: ad.impressionCount || 0,
      createdBy: ad.createdBy,
      maxImpressions: ad.maxImpressions || 0,
      budget: Number(ad.budget) || 0,
      spentAmount: Number(ad.spentAmount) || 0,
      createdAt: ad.createdAt,
    };
  }

  async update(adId: string, updateAdDto: UpdateAdDto, adminId: string) {
    if (!isValidId(adId)) {
      throw new BadRequestException('Invalid ad ID format');
    }

    const ad = await this.adRepository.findOne({ where: { id: adId } });
    if (!ad) {
      throw new NotFoundException('Ad not found');
    }

    const updateData: any = { ...updateAdDto };
    if (updateAdDto.startDate) updateData.startDate = new Date(updateAdDto.startDate);
    if (updateAdDto.endDate) updateData.endDate = new Date(updateAdDto.endDate);

    if (updateData.startDate && updateData.endDate && updateData.endDate <= updateData.startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    Object.assign(ad, updateData);
    await this.adRepository.save(ad);

    const log = this.activityLogRepository.create({
      adminId,
      activityType: ActivityType.AD_UPDATED,
      targetAdId: adId,
      description: `Ad updated: ${ad.title}`,
      metadata: { adId, updates: updateAdDto },
    });
    await this.activityLogRepository.save(log);

    return ad;
  }

  async delete(adId: string, adminId: string) {
    if (!isValidId(adId)) {
      throw new BadRequestException('Invalid ad ID format');
    }

    const ad = await this.adRepository.findOne({ where: { id: adId } });
    if (!ad) {
      throw new NotFoundException('Ad not found');
    }

    await this.adRepository.delete({ id: adId });

    const log = this.activityLogRepository.create({
      adminId,
      activityType: ActivityType.AD_DELETED,
      targetAdId: adId,
      description: `Ad deleted: ${ad.title}`,
      metadata: { adId },
    });
    await this.activityLogRepository.save(log);

    return { success: true };
  }

  async recordImpression(adId: string) {
    await this.adRepository.increment({ id: adId }, 'impressionCount', 1);
  }

  async recordClick(adId: string) {
    await this.adRepository.increment({ id: adId }, 'clickCount', 1);
  }

  async recordView(adId: string) {
    await this.adRepository.increment({ id: adId }, 'viewCount', 1);
  }

  async getStatistics(adId?: string) {
    if (adId) {
      const ad = await this.adRepository.findOne({ where: { id: adId } });
      if (!ad) {
        throw new NotFoundException('Ad not found');
      }
      return {
        adId: ad.id,
        title: ad.title,
        clickCount: ad.clickCount,
        viewCount: ad.viewCount,
        impressionCount: ad.impressionCount,
        ctr: ad.impressionCount > 0 ? (ad.clickCount / ad.impressionCount) * 100 : 0,
        spentAmount: Number(ad.spentAmount) || 0,
        budget: Number(ad.budget) || 0,
        remainingBudget: (Number(ad.budget) || 0) - (Number(ad.spentAmount) || 0),
      };
    }

    const totalAds = await this.adRepository.count();
    const activeAds = await this.adRepository.count({ where: { status: AdStatus.ACTIVE } });
    const pausedAds = await this.adRepository.count({ where: { status: AdStatus.PAUSED } });
    const expiredAds = await this.adRepository.count({ where: { status: AdStatus.EXPIRED } });

    const statsRaw = await this.adRepository
      .createQueryBuilder('ad')
      .select('SUM(ad.clickCount)', 'totalClicks')
      .addSelect('SUM(ad.viewCount)', 'totalViews')
      .addSelect('SUM(ad.impressionCount)', 'totalImpressions')
      .addSelect('SUM(ad.spentAmount)', 'totalSpent')
      .addSelect('SUM(ad.budget)', 'totalBudget')
      .getRawOne();

    const totalClicks = parseInt(statsRaw?.totalClicks || '0');
    const totalViews = parseInt(statsRaw?.totalViews || '0');
    const totalImpressions = parseInt(statsRaw?.totalImpressions || '0');
    const totalSpent = parseFloat(statsRaw?.totalSpent || '0');
    const totalBudget = parseFloat(statsRaw?.totalBudget || '0');

    return {
      totalAds,
      activeAds,
      pausedAds,
      expiredAds,
      totalClicks,
      totalViews,
      totalImpressions,
      totalCTR: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      totalSpent,
      totalBudget,
      remainingBudget: totalBudget - totalSpent,
    };
  }
}
