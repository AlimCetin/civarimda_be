"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const ad_entity_1 = require("../entities/ad.entity");
const activity_log_entity_1 = require("../entities/activity-log.entity");
const id_util_1 = require("../common/utils/id.util");
let AdsService = class AdsService {
    adRepository;
    activityLogRepository;
    constructor(adRepository, activityLogRepository) {
        this.adRepository = adRepository;
        this.activityLogRepository = activityLogRepository;
    }
    async create(createAdDto, adminId) {
        const startDate = new Date(createAdDto.startDate);
        const endDate = new Date(createAdDto.endDate);
        if (endDate <= startDate) {
            throw new common_1.BadRequestException('End date must be after start date');
        }
        const ad = this.adRepository.create({
            ...createAdDto,
            startDate,
            endDate,
            status: createAdDto.status || ad_entity_1.AdStatus.DRAFT,
            createdBy: adminId,
            clickCount: 0,
            viewCount: 0,
            impressionCount: 0,
            spentAmount: 0,
        });
        await this.adRepository.save(ad);
        const log = this.activityLogRepository.create({
            adminId,
            activityType: activity_log_entity_1.ActivityType.AD_CREATED,
            targetAdId: ad.id,
            description: `Ad created: ${ad.title}`,
            metadata: { adId: ad.id },
        });
        await this.activityLogRepository.save(log);
        return ad;
    }
    async findAll(status, page = 1, limit = 20) {
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
            .where('ad.status = :status', { status: ad_entity_1.AdStatus.ACTIVE })
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
    async findOne(adId) {
        if (!(0, id_util_1.isValidId)(adId)) {
            throw new common_1.BadRequestException('Invalid ad ID format');
        }
        const ad = await this.adRepository.findOne({ where: { id: adId } });
        if (!ad) {
            throw new common_1.NotFoundException('Ad not found');
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
    async update(adId, updateAdDto, adminId) {
        if (!(0, id_util_1.isValidId)(adId)) {
            throw new common_1.BadRequestException('Invalid ad ID format');
        }
        const ad = await this.adRepository.findOne({ where: { id: adId } });
        if (!ad) {
            throw new common_1.NotFoundException('Ad not found');
        }
        const updateData = { ...updateAdDto };
        if (updateAdDto.startDate)
            updateData.startDate = new Date(updateAdDto.startDate);
        if (updateAdDto.endDate)
            updateData.endDate = new Date(updateAdDto.endDate);
        if (updateData.startDate && updateData.endDate && updateData.endDate <= updateData.startDate) {
            throw new common_1.BadRequestException('End date must be after start date');
        }
        Object.assign(ad, updateData);
        await this.adRepository.save(ad);
        const log = this.activityLogRepository.create({
            adminId,
            activityType: activity_log_entity_1.ActivityType.AD_UPDATED,
            targetAdId: adId,
            description: `Ad updated: ${ad.title}`,
            metadata: { adId, updates: updateAdDto },
        });
        await this.activityLogRepository.save(log);
        return ad;
    }
    async delete(adId, adminId) {
        if (!(0, id_util_1.isValidId)(adId)) {
            throw new common_1.BadRequestException('Invalid ad ID format');
        }
        const ad = await this.adRepository.findOne({ where: { id: adId } });
        if (!ad) {
            throw new common_1.NotFoundException('Ad not found');
        }
        await this.adRepository.delete({ id: adId });
        const log = this.activityLogRepository.create({
            adminId,
            activityType: activity_log_entity_1.ActivityType.AD_DELETED,
            targetAdId: adId,
            description: `Ad deleted: ${ad.title}`,
            metadata: { adId },
        });
        await this.activityLogRepository.save(log);
        return { success: true };
    }
    async recordImpression(adId) {
        await this.adRepository.increment({ id: adId }, 'impressionCount', 1);
    }
    async recordClick(adId) {
        await this.adRepository.increment({ id: adId }, 'clickCount', 1);
    }
    async recordView(adId) {
        await this.adRepository.increment({ id: adId }, 'viewCount', 1);
    }
    async getStatistics(adId) {
        if (adId) {
            const ad = await this.adRepository.findOne({ where: { id: adId } });
            if (!ad) {
                throw new common_1.NotFoundException('Ad not found');
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
        const activeAds = await this.adRepository.count({ where: { status: ad_entity_1.AdStatus.ACTIVE } });
        const pausedAds = await this.adRepository.count({ where: { status: ad_entity_1.AdStatus.PAUSED } });
        const expiredAds = await this.adRepository.count({ where: { status: ad_entity_1.AdStatus.EXPIRED } });
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
};
exports.AdsService = AdsService;
exports.AdsService = AdsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(ad_entity_1.Ad)),
    __param(1, (0, typeorm_1.InjectRepository)(activity_log_entity_1.ActivityLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], AdsService);
//# sourceMappingURL=ads.service.js.map