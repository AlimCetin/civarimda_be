import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, MoreThan, Repository } from 'typeorm';
import { Ad, AdScope, AdStatus } from '../entities/ad.entity';
import { AdPackage } from '../entities/ad-package.entity';
import { AdPurchase, PaymentStatus } from '../entities/ad-purchase.entity';
import { ActivityLog, ActivityType } from '../entities/activity-log.entity';
import { User } from '../entities/user.entity';
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';
import {
  CreateBusinessAdDto,
  CreatePaidBusinessAdDto,
  PurchaseAdPackageDto,
} from './dto/business-ad.dto';
import { CreateAdPackageDto, UpdateAdPackageDto } from './dto/ad-package.dto';
import { isValidId } from '../common/utils/id.util';

const FREE_AD_DURATION_DAYS = 7;
const FREE_AD_MAX_IMPRESSIONS = 500;

@Injectable()
export class AdsService implements OnModuleInit {
  constructor(
    @InjectRepository(Ad) private adRepository: Repository<Ad>,
    @InjectRepository(AdPackage) private packageRepository: Repository<AdPackage>,
    @InjectRepository(AdPurchase) private purchaseRepository: Repository<AdPurchase>,
    @InjectRepository(ActivityLog) private activityLogRepository: Repository<ActivityLog>,
    @InjectRepository(User) private userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    const defaults: Array<Partial<AdPackage>> = [
      {
        code: 'REGIONAL_WEEKLY_2500',
        name: 'Bölgesel Esnaf Başlangıç',
        description: 'Seçtiğiniz şehirde 7 gün boyunca 2.500 görüntülenme.',
        scope: AdScope.REGIONAL,
        durationDays: 7,
        maxImpressions: 2500,
        price: 149,
        currency: 'TRY',
        isActive: true,
      },
      {
        code: 'REGIONAL_MONTHLY_10000',
        name: 'Bölgesel Esnaf Pro',
        description: 'Seçtiğiniz şehirde 30 gün boyunca 10.000 görüntülenme.',
        scope: AdScope.REGIONAL,
        durationDays: 30,
        maxImpressions: 10000,
        price: 449,
        currency: 'TRY',
        isActive: true,
      },
      {
        code: 'NATIONAL_PRO_50000',
        name: 'Türkiye Geneli Ulusal Vitrin',
        description: 'Tüm Türkiye genelinde 30 gün boyunca 50.000 görüntülenme.',
        scope: AdScope.NATIONAL,
        durationDays: 30,
        maxImpressions: 50000,
        price: 1499,
        currency: 'TRY',
        isActive: true,
      },
    ];

    for (const pkg of defaults) {
      const existing = await this.packageRepository.findOne({ where: { code: pkg.code } });
      if (!existing) {
        await this.packageRepository.save(this.packageRepository.create(pkg));
      }
    }
  }

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

  async getActiveAds(city?: string) {
    const now = new Date();

    // Süresi veya görüntülenme kotası dolmuş aktif reklamları otomatik olarak EXPIRED yap
    await this.adRepository
      .createQueryBuilder()
      .update(Ad)
      .set({ status: AdStatus.EXPIRED })
      .where('status = :activeStatus', { activeStatus: AdStatus.ACTIVE })
      .andWhere('(endDate < :now OR (maxImpressions > 0 AND impressionCount >= maxImpressions))', {
        now,
      })
      .execute();

    const qb = this.adRepository
      .createQueryBuilder('ad')
      .where('ad.status = :status', { status: AdStatus.ACTIVE })
      .andWhere('ad.startDate <= :now AND ad.endDate >= :now', { now })
      .andWhere('(ad.maxImpressions = 0 OR ad.impressionCount < ad.maxImpressions)');

    if (city && city.trim()) {
      const cleanCity = city.split('-')[0].trim();
      qb.andWhere(
        '(ad.scope = :nationalScope OR ad.city IS NULL OR ad.city ILIKE :city OR ad.city ILIKE :cleanCity)',
        {
          nationalScope: AdScope.NATIONAL,
          city: `%${city.trim()}%`,
          cleanCity: `%${cleanCity}%`,
        },
      );
    }

    const ads = await qb.orderBy('ad.createdAt', 'DESC').getMany();

    return ads.map((ad) => ({
      id: ad.id,
      _id: ad.id,
      title: ad.title,
      type: ad.type,
      mediaUrl: ad.mediaUrl,
      linkUrl: ad.linkUrl,
      description: ad.description || '',
      status: ad.status,
      scope: ad.scope,
      city: ad.city,
      isFreeTier: ad.isFreeTier,
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

  async getPackages() {
    return this.packageRepository.find({
      where: { isActive: true },
      order: { price: 'ASC' },
    });
  }

  async getAllPackagesAdmin() {
    return this.packageRepository.find({
      order: { price: 'ASC', createdAt: 'DESC' },
    });
  }

  async createPackage(dto: CreateAdPackageDto) {
    const pkg = this.packageRepository.create({
      code: dto.code.trim().toUpperCase(),
      name: dto.name.trim(),
      description: dto.description ?? '',
      scope: dto.scope,
      durationDays: dto.durationDays,
      maxImpressions: dto.maxImpressions,
      price: dto.price,
      currency: dto.currency ?? 'TRY',
      isActive: dto.isActive ?? true,
    });
    return this.packageRepository.save(pkg);
  }

  async updatePackage(id: string, dto: UpdateAdPackageDto) {
    if (!isValidId(id)) {
      throw new BadRequestException('Geçersiz paket kimliği.');
    }
    const pkg = await this.packageRepository.findOne({ where: { id } });
    if (!pkg) {
      throw new NotFoundException('Reklam paketi bulunamadı.');
    }
    if (dto.name !== undefined) pkg.name = dto.name.trim();
    if (dto.description !== undefined) pkg.description = dto.description;
    if (dto.scope !== undefined) pkg.scope = dto.scope;
    if (dto.durationDays !== undefined) pkg.durationDays = dto.durationDays;
    if (dto.maxImpressions !== undefined) pkg.maxImpressions = dto.maxImpressions;
    if (dto.price !== undefined) pkg.price = dto.price;
    if (dto.isActive !== undefined) pkg.isActive = dto.isActive;
    return this.packageRepository.save(pkg);
  }

  async deletePackage(id: string) {
    if (!isValidId(id)) {
      throw new BadRequestException('Geçersiz paket kimliği.');
    }
    await this.packageRepository.delete(id);
    return { success: true };
  }

  private async assertBusinessProfileCompleted(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !user.isBusiness || !user.businessName) {
      throw new ForbiddenException(
        'Reklam verebilmek için önce işletme bilgilerinizi tamamlamalısınız.',
      );
    }
    return user;
  }

  async getMyBusinessAds(userId: string) {
    const [ads, freeAdCount, activePurchases] = await Promise.all([
      this.adRepository.find({
        where: { createdBy: userId },
        order: { createdAt: 'DESC' },
      }),
      this.adRepository.count({
        where: { createdBy: userId, isFreeTier: true },
      }),
      this.purchaseRepository.find({
        where: {
          userId,
          paymentStatus: PaymentStatus.PAID,
          remainingAdCredits: MoreThan(0),
        },
        order: { createdAt: 'DESC' },
      }),
    ]);

    return {
      hasUsedFreeAd: freeAdCount > 0,
      freeTierPolicy: {
        durationDays: FREE_AD_DURATION_DAYS,
        maxImpressions: FREE_AD_MAX_IMPRESSIONS,
      },
      availableCredits: activePurchases.reduce((sum, p) => sum + p.remainingAdCredits, 0),
      purchases: activePurchases,
      ads: ads.map((ad) => ad.toObject()),
    };
  }

  async createFreeBusinessAd(userId: string, dto: CreateBusinessAdDto) {
    const user = await this.assertBusinessProfileCompleted(userId);
    const scope = dto.scope || AdScope.REGIONAL;
    if (scope === AdScope.REGIONAL && (!dto.city || !dto.city.trim())) {
      throw new BadRequestException('Bölgesel reklamlar için şehir bilgisi zorunludur.');
    }

    const normalizedPhone = (user.businessPhone || '').replace(/\D/g, '');

    return this.dataSource.transaction(async (manager) => {
      // Kullanıcı veya aynı işletme telefonu başına 1 adet ücretsiz reklam hakkını kontrol et
      const existingByUser = await manager.findOne(Ad, {
        where: { createdBy: userId, isFreeTier: true },
      });
      if (existingByUser) {
        throw new ForbiddenException(
          'Ücretsiz reklam hakkınızı (1 hafta / 500 görüntülenme) zaten kullandınız. Yeni reklam vermek için bir reklam paketi satın almalısınız.',
        );
      }

      if (normalizedPhone) {
        const existingByPhone = await manager.findOne(Ad, {
          where: { businessPhone: normalizedPhone, isFreeTier: true },
        });
        if (existingByPhone) {
          throw new ForbiddenException(
            'Bu işletme telefon numarasıyla ücretsiz reklam hakkı daha önce kullanılmış.',
          );
        }
      }

      const autoApprove = process.env.AUTO_APPROVE_FREE_ADS === 'true';
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + FREE_AD_DURATION_DAYS * 24 * 60 * 60 * 1000);

      const ad = manager.create(Ad, {
        title: dto.title,
        type: dto.type,
        mediaUrl: dto.mediaUrl,
        linkUrl: dto.linkUrl,
        description: dto.description ?? '',
        scope,
        city: scope === AdScope.NATIONAL ? null : dto.city!.trim(),
        isFreeTier: true,
        businessPhone: normalizedPhone || null,
        packageId: null,
        status: autoApprove ? AdStatus.ACTIVE : AdStatus.PENDING_REVIEW,
        startDate,
        endDate,
        maxImpressions: FREE_AD_MAX_IMPRESSIONS,
        budget: 0,
        spentAmount: 0,
        createdBy: userId,
        clickCount: 0,
        viewCount: 0,
        impressionCount: 0,
      });

      const saved = await manager.save(Ad, ad);
      return saved.toObject();
    });
  }

  async approveAd(adId: string, adminId: string) {
    if (!isValidId(adId)) {
      throw new BadRequestException('Geçersiz reklam kimliği.');
    }
    const ad = await this.adRepository.findOne({ where: { id: adId } });
    if (!ad) {
      throw new NotFoundException('Reklam bulunamadı.');
    }

    const now = new Date();
    ad.status = AdStatus.ACTIVE;
    if (ad.isFreeTier) {
      ad.startDate = now;
      ad.endDate = new Date(now.getTime() + FREE_AD_DURATION_DAYS * 24 * 60 * 60 * 1000);
    }

    const saved = await this.adRepository.save(ad);
    await this.activityLogRepository.save(
      this.activityLogRepository.create({
        adminId,
        activityType: ActivityType.AD_UPDATED,
        targetAdId: ad.id,
        description: `Ad approved: ${ad.title}`,
        metadata: { adId: ad.id },
      }),
    );

    return saved.toObject();
  }

  async purchasePackage(userId: string, packageId: string, dto: PurchaseAdPackageDto) {
    if (!isValidId(packageId)) {
      throw new BadRequestException('Geçersiz paket kimliği.');
    }

    const pkg = await this.packageRepository.findOne({
      where: { id: packageId, isActive: true },
    });
    if (!pkg) {
      throw new NotFoundException('Reklam paketi bulunamadı.');
    }

    const purchase = this.purchaseRepository.create({
      userId,
      packageId: pkg.id,
      amountPaid: Number(pkg.price),
      currency: pkg.currency,
      paymentStatus: PaymentStatus.PAID,
      paymentReference: dto.paymentReference || `PKG-${Date.now()}`,
      remainingAdCredits: 1,
    });

    const saved = await this.purchaseRepository.save(purchase);
    return {
      purchase: saved,
      package: pkg,
    };
  }

  async createPaidBusinessAd(userId: string, dto: CreatePaidBusinessAdDto) {
    await this.assertBusinessProfileCompleted(userId);
    return this.dataSource.transaction(async (manager) => {
      const purchase = await manager.findOne(AdPurchase, {
        where: { id: dto.purchaseId, userId, paymentStatus: PaymentStatus.PAID },
        lock: { mode: 'pessimistic_write' },
      });

      if (!purchase || purchase.remainingAdCredits <= 0) {
        throw new ForbiddenException('Geçerli veya kullanılabilir reklam paketi krediniz bulunamadı.');
      }

      const pkg = await manager.findOne(AdPackage, {
        where: { id: purchase.packageId },
      });
      if (!pkg) {
        throw new NotFoundException('Satın alınan reklam paketi bulunamadı.');
      }

      if (pkg.scope === AdScope.REGIONAL && (!dto.city || !dto.city.trim())) {
        throw new BadRequestException('Bölgesel reklam paketi için şehir bilgisi zorunludur.');
      }

      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + pkg.durationDays * 24 * 60 * 60 * 1000);

      const ad = manager.create(Ad, {
        title: dto.title,
        type: dto.type,
        mediaUrl: dto.mediaUrl,
        linkUrl: dto.linkUrl,
        description: dto.description ?? '',
        scope: pkg.scope,
        city: pkg.scope === AdScope.NATIONAL ? null : dto.city!.trim(),
        isFreeTier: false,
        packageId: pkg.id,
        status: AdStatus.ACTIVE,
        startDate,
        endDate,
        maxImpressions: pkg.maxImpressions,
        budget: Number(pkg.price),
        spentAmount: Number(pkg.price),
        createdBy: userId,
        clickCount: 0,
        viewCount: 0,
        impressionCount: 0,
      });

      const savedAd = await manager.save(Ad, ad);

      purchase.remainingAdCredits -= 1;
      purchase.adId = savedAd.id;
      await manager.save(AdPurchase, purchase);

      return savedAd.toObject();
    });
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
    if (!isValidId(adId)) return;

    await this.adRepository.increment({ id: adId }, 'impressionCount', 1);

    // Görüntülenme kotası (örn. 500) veya süre dolduysa reklamı otomatik olarak kaldır (EXPIRED)
    const now = new Date();
    await this.adRepository
      .createQueryBuilder()
      .update(Ad)
      .set({ status: AdStatus.EXPIRED })
      .where('id = :adId', { adId })
      .andWhere('status = :activeStatus', { activeStatus: AdStatus.ACTIVE })
      .andWhere('(endDate <= :now OR (maxImpressions > 0 AND impressionCount >= maxImpressions))', {
        now,
      })
      .execute();
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
