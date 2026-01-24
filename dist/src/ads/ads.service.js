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
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const ad_entity_1 = require("../entities/ad.entity");
const activity_log_entity_1 = require("../entities/activity-log.entity");
let AdsService = class AdsService {
    adModel;
    activityLogModel;
    constructor(adModel, activityLogModel) {
        this.adModel = adModel;
        this.activityLogModel = activityLogModel;
    }
    async create(createAdDto, adminId) {
        const startDate = new Date(createAdDto.startDate);
        const endDate = new Date(createAdDto.endDate);
        if (endDate <= startDate) {
            throw new common_1.BadRequestException('End date must be after start date');
        }
        const ad = await this.adModel.create({
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
        await this.activityLogModel.create({
            adminId,
            activityType: activity_log_entity_1.ActivityType.AD_CREATED,
            targetAdId: ad._id.toString(),
            description: `Ad created: ${ad.title}`,
            metadata: { adId: ad._id.toString() },
        });
        return ad;
    }
    async findAll(status, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const maxLimit = Math.min(limit, 100);
        const filter = {};
        if (status)
            filter.status = status;
        const ads = await this.adModel
            .find(filter)
            .populate('createdBy', 'fullName avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(maxLimit)
            .lean();
        const total = await this.adModel.countDocuments(filter);
        return {
            ads: ads.map((ad) => ({
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
                createdBy: (ad.createdBy && typeof ad.createdBy === 'object' ? (ad.createdBy._id || ad.createdBy) : ad.createdBy)?.toString(),
                maxImpressions: ad.maxImpressions || 0,
                budget: ad.budget || 0,
                spentAmount: ad.spentAmount || 0,
                createdAt: ad.createdAt || new Date(),
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
            status: ad_entity_1.AdStatus.ACTIVE,
            startDate: { $lte: now },
            endDate: { $gte: now },
            $or: [
                { maxImpressions: 0 },
                { $expr: { $lt: ['$impressionCount', '$maxImpressions'] } },
            ],
        }).lean();
        return ads.map((ad) => ({
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
            createdBy: (ad.createdBy && typeof ad.createdBy === 'object' ? (ad.createdBy._id || ad.createdBy) : ad.createdBy)?.toString(),
            maxImpressions: ad.maxImpressions || 0,
            budget: ad.budget || 0,
            spentAmount: ad.spentAmount || 0,
            createdAt: ad.createdAt || new Date(),
        }));
    }
    async findOne(adId) {
        if (!mongoose_2.Types.ObjectId.isValid(adId)) {
            throw new common_1.BadRequestException('Invalid ad ID format');
        }
        const ad = await this.adModel
            .findById(adId)
            .populate('createdBy', 'fullName avatar')
            .lean();
        if (!ad) {
            throw new common_1.NotFoundException('Ad not found');
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
            createdBy: (ad.createdBy && typeof ad.createdBy === 'object' ? (ad.createdBy._id || ad.createdBy) : ad.createdBy)?.toString(),
            maxImpressions: ad.maxImpressions || 0,
            budget: ad.budget || 0,
            spentAmount: ad.spentAmount || 0,
            createdAt: ad.createdAt || new Date(),
        };
    }
    async update(adId, updateAdDto, adminId) {
        if (!mongoose_2.Types.ObjectId.isValid(adId)) {
            throw new common_1.BadRequestException('Invalid ad ID format');
        }
        const ad = await this.adModel.findById(adId);
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
        await ad.save();
        await this.activityLogModel.create({
            adminId,
            activityType: activity_log_entity_1.ActivityType.AD_UPDATED,
            targetAdId: adId,
            description: `Ad updated: ${ad.title}`,
            metadata: { adId, updates: updateAdDto },
        });
        return ad;
    }
    async delete(adId, adminId) {
        if (!mongoose_2.Types.ObjectId.isValid(adId)) {
            throw new common_1.BadRequestException('Invalid ad ID format');
        }
        const ad = await this.adModel.findById(adId);
        if (!ad) {
            throw new common_1.NotFoundException('Ad not found');
        }
        await this.adModel.findByIdAndDelete(adId);
        await this.activityLogModel.create({
            adminId,
            activityType: activity_log_entity_1.ActivityType.AD_DELETED,
            targetAdId: adId,
            description: `Ad deleted: ${ad.title}`,
            metadata: { adId },
        });
        return { success: true };
    }
    async recordImpression(adId) {
        await this.adModel.findByIdAndUpdate(adId, {
            $inc: { impressionCount: 1 },
        });
    }
    async recordClick(adId) {
        await this.adModel.findByIdAndUpdate(adId, {
            $inc: { clickCount: 1 },
        });
    }
    async recordView(adId) {
        await this.adModel.findByIdAndUpdate(adId, {
            $inc: { viewCount: 1 },
        });
    }
    async getStatistics(adId) {
        if (adId) {
            const ad = await this.adModel.findById(adId);
            if (!ad) {
                throw new common_1.NotFoundException('Ad not found');
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
        const totalAds = await this.adModel.countDocuments();
        const activeAds = await this.adModel.countDocuments({ status: ad_entity_1.AdStatus.ACTIVE });
        const pausedAds = await this.adModel.countDocuments({ status: ad_entity_1.AdStatus.PAUSED });
        const expiredAds = await this.adModel.countDocuments({ status: ad_entity_1.AdStatus.EXPIRED });
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
};
exports.AdsService = AdsService;
exports.AdsService = AdsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(ad_entity_1.Ad.name)),
    __param(1, (0, mongoose_1.InjectModel)(activity_log_entity_1.ActivityLog.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], AdsService);
//# sourceMappingURL=ads.service.js.map