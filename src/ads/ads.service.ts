import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Ad, AdStatus } from '../entities/ad.entity';
import { ActivityLog, ActivityType } from '../entities/activity-log.entity';
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';

@Injectable()
export class AdsService {
  constructor(
    @InjectModel(Ad.name) private adModel: Model<Ad>,
    @InjectModel(ActivityLog.name) private activityLogModel: Model<ActivityLog>,
  ) {}

  async create(createAdDto: CreateAdDto, adminId: string) {
    const startDate = new Date(createAdDto.startDate);
    const endDate = new Date(createAdDto.endDate);

    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    const ad = await this.adModel.create({
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

    // Log activity
    await this.activityLogModel.create({
      adminId,
      activityType: ActivityType.AD_CREATED,
      targetAdId: ad._id.toString(),
      description: `Ad created: ${ad.title}`,
      metadata: { adId: ad._id.toString() },
    });

    return ad;
  }

  async findAll(
    status?: AdStatus,
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;
    const maxLimit = Math.min(limit, 100);

    const filter: any = {};
    if (status) filter.status = status;

    const ads = await this.adModel
      .find(filter)
      .populate('createdBy', 'fullName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(maxLimit)
      .lean();

    const total = await this.adModel.countDocuments(filter);

    return {
      ads: ads.map((ad: any) => ({
        id: ad._id.toString(),
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
        createdBy: (ad.createdBy && typeof ad.createdBy === 'object' ? ((ad.createdBy as any)._id || ad.createdBy) : ad.createdBy)?.toString(),
        maxImpressions: ad.maxImpressions || 0,
        budget: ad.budget || 0,
        spentAmount: ad.spentAmount || 0,
        createdAt: (ad as any).createdAt || new Date(),
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
    const ads = await this.adModel.find({
      status: AdStatus.ACTIVE,
      startDate: { $lte: now },
      endDate: { $gte: now },
      $or: [
        { maxImpressions: 0 },
        { $expr: { $lt: ['$impressionCount', '$maxImpressions'] } },
      ],
    }).lean();
    
    return ads.map((ad: any) => ({
      id: ad._id.toString(),
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
      createdBy: (ad.createdBy && typeof ad.createdBy === 'object' ? ((ad.createdBy as any)._id || ad.createdBy) : ad.createdBy)?.toString(),
      maxImpressions: ad.maxImpressions || 0,
      budget: ad.budget || 0,
      spentAmount: ad.spentAmount || 0,
      createdAt: (ad as any).createdAt || new Date(),
    }));
  }

  async findOne(adId: string) {
    if (!Types.ObjectId.isValid(adId)) {
      throw new BadRequestException('Invalid ad ID format');
    }

    const ad = await this.adModel
      .findById(adId)
      .populate('createdBy', 'fullName avatar')
      .lean();

    if (!ad) {
      throw new NotFoundException('Ad not found');
    }

    return {
      id: ad._id.toString(),
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
      createdBy: (ad.createdBy && typeof ad.createdBy === 'object' ? ((ad.createdBy as any)._id || ad.createdBy) : ad.createdBy)?.toString(),
      maxImpressions: ad.maxImpressions || 0,
      budget: ad.budget || 0,
      spentAmount: ad.spentAmount || 0,
      createdAt: (ad as any).createdAt || new Date(),
    };
  }

  async update(adId: string, updateAdDto: UpdateAdDto, adminId: string) {
    if (!Types.ObjectId.isValid(adId)) {
      throw new BadRequestException('Invalid ad ID format');
    }

    const ad = await this.adModel.findById(adId);
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
    await ad.save();

    // Log activity
    await this.activityLogModel.create({
      adminId,
      activityType: ActivityType.AD_UPDATED,
      targetAdId: adId,
      description: `Ad updated: ${ad.title}`,
      metadata: { adId, updates: updateAdDto },
    });

    return ad;
  }

  async delete(adId: string, adminId: string) {
    if (!Types.ObjectId.isValid(adId)) {
      throw new BadRequestException('Invalid ad ID format');
    }

    const ad = await this.adModel.findById(adId);
    if (!ad) {
      throw new NotFoundException('Ad not found');
    }

    await this.adModel.findByIdAndDelete(adId);

    // Log activity
    await this.activityLogModel.create({
      adminId,
      activityType: ActivityType.AD_DELETED,
      targetAdId: adId,
      description: `Ad deleted: ${ad.title}`,
      metadata: { adId },
    });

    return { success: true };
  }

  async recordImpression(adId: string) {
    await this.adModel.findByIdAndUpdate(adId, {
      $inc: { impressionCount: 1 },
    });
  }

  async recordClick(adId: string) {
    await this.adModel.findByIdAndUpdate(adId, {
      $inc: { clickCount: 1 },
    });
  }

  async recordView(adId: string) {
    await this.adModel.findByIdAndUpdate(adId, {
      $inc: { viewCount: 1 },
    });
  }

  async getStatistics(adId?: string) {
    if (adId) {
      const ad = await this.adModel.findById(adId);
      if (!ad) {
        throw new NotFoundException('Ad not found');
      }
      return {
        adId: ad._id.toString(),
        title: ad.title,
        clickCount: ad.clickCount,
        viewCount: ad.viewCount,
        impressionCount: ad.impressionCount,
        ctr: ad.impressionCount > 0 ? (ad.clickCount / ad.impressionCount) * 100 : 0,
        spentAmount: ad.spentAmount,
        budget: ad.budget,
        remainingBudget: ad.budget - ad.spentAmount,
      };
    }

    // Overall statistics
    const totalAds = await this.adModel.countDocuments();
    const activeAds = await this.adModel.countDocuments({ status: AdStatus.ACTIVE });
    const pausedAds = await this.adModel.countDocuments({ status: AdStatus.PAUSED });
    const expiredAds = await this.adModel.countDocuments({ status: AdStatus.EXPIRED });

    const totalStats = await this.adModel.aggregate([
      {
        $group: {
          _id: null,
          totalClicks: { $sum: '$clickCount' },
          totalViews: { $sum: '$viewCount' },
          totalImpressions: { $sum: '$impressionCount' },
          totalSpent: { $sum: '$spentAmount' },
          totalBudget: { $sum: '$budget' },
        },
      },
    ]);

    const stats = totalStats[0] || {
      totalClicks: 0,
      totalViews: 0,
      totalImpressions: 0,
      totalSpent: 0,
      totalBudget: 0,
    };

    return {
      totalAds,
      activeAds,
      pausedAds,
      expiredAds,
      totalClicks: stats.totalClicks,
      totalViews: stats.totalViews,
      totalImpressions: stats.totalImpressions,
      totalCTR: stats.totalImpressions > 0
        ? (stats.totalClicks / stats.totalImpressions) * 100
        : 0,
      totalSpent: stats.totalSpent,
      totalBudget: stats.totalBudget,
      remainingBudget: stats.totalBudget - stats.totalSpent,
    };
  }
}

