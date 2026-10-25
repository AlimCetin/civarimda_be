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
exports.CampaignsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const campaign_entity_1 = require("../entities/campaign.entity");
const claimed_code_entity_1 = require("../entities/claimed-code.entity");
const item_comment_entity_1 = require("../entities/item-comment.entity");
const user_entity_1 = require("../entities/user.entity");
let CampaignsService = class CampaignsService {
    campaignRepo;
    codeRepo;
    commentRepo;
    userRepo;
    constructor(campaignRepo, codeRepo, commentRepo, userRepo) {
        this.campaignRepo = campaignRepo;
        this.codeRepo = codeRepo;
        this.commentRepo = commentRepo;
        this.userRepo = userRepo;
    }
    async findAll(city, lat, lng, radiusKm) {
        const qb = this.campaignRepo.createQueryBuilder('c');
        const hasCoords = lat !== undefined &&
            lat !== null &&
            !isNaN(Number(lat)) &&
            lng !== undefined &&
            lng !== null &&
            !isNaN(Number(lng));
        const userLat = hasCoords ? Number(lat) : null;
        const userLng = hasCoords ? Number(lng) : null;
        const radius = radiusKm !== undefined &&
            radiusKm !== null &&
            !isNaN(Number(radiusKm)) &&
            Number(radiusKm) > 0
            ? Number(radiusKm)
            : null;
        if (hasCoords && userLat !== null && userLng !== null) {
            const haversineFormula = `(6371 * acos(least(1.0, greatest(-1.0, cos(radians(:lat)) * cos(radians(c.latitude)) * cos(radians(c.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(c.latitude))))))`;
            qb.addSelect(haversineFormula, 'distance').setParameters({
                lat: userLat,
                lng: userLng,
            });
            if (radius) {
                qb.andWhere(`c.latitude IS NOT NULL AND c.longitude IS NOT NULL AND ${haversineFormula} <= :radius`, { radius });
            }
            qb.orderBy('CASE WHEN c.latitude IS NOT NULL AND c.longitude IS NOT NULL THEN 0 ELSE 1 END', 'ASC')
                .addOrderBy('distance', 'ASC')
                .addOrderBy('c.createdAt', 'DESC');
        }
        else {
            qb.orderBy('c.createdAt', 'DESC');
        }
        if (city && city.trim() && !radius) {
            const cleanCity = city.split('-')[0].trim();
            qb.where('c.city ILIKE :city OR c.city ILIKE :cleanCity', {
                city: `%${city}%`,
                cleanCity: `%${cleanCity}%`,
            });
        }
        if (hasCoords) {
            const rawAndEntities = await qb.getRawAndEntities();
            return rawAndEntities.entities.map((campaign, idx) => {
                const rawDist = rawAndEntities.raw[idx]?.distance;
                const parsedDist = rawDist !== null && rawDist !== undefined
                    ? Math.round(Number(rawDist) * 10) / 10
                    : null;
                return campaign.toObject(parsedDist);
            });
        }
        else {
            const items = await qb.getMany();
            return items.map((i) => i.toObject());
        }
    }
    async findMyCampaigns(userId) {
        const items = await this.campaignRepo.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
        return items.map((i) => i.toObject());
    }
    async findOne(id) {
        const item = await this.campaignRepo.findOne({ where: { id } });
        if (!item)
            throw new common_1.NotFoundException('Kampanya bulunamadı');
        return item.toObject();
    }
    async create(userId, data) {
        const lat = data.latitude !== undefined && data.latitude !== null && data.latitude !== ''
            ? Number(data.latitude)
            : null;
        const lng = data.longitude !== undefined && data.longitude !== null && data.longitude !== ''
            ? Number(data.longitude)
            : null;
        const campaign = this.campaignRepo.create({
            ...data,
            userId,
            likes: [],
            currentClaims: 0,
            commentCount: 0,
            latitude: lat,
            longitude: lng,
        });
        const saved = await this.campaignRepo.save(campaign);
        return saved.toObject();
    }
    async update(id, userId, userRole, data) {
        const campaign = await this.campaignRepo.findOne({ where: { id } });
        if (!campaign)
            throw new common_1.NotFoundException('Kampanya bulunamadı');
        const canEdit = campaign.userId === userId || ['admin', 'super_admin', 'moderator'].includes(userRole);
        if (!canEdit)
            throw new common_1.ForbiddenException('Bu kampanyayı düzenleme yetkiniz yok');
        if (data.latitude !== undefined) {
            data.latitude =
                data.latitude !== null && data.latitude !== '' ? Number(data.latitude) : null;
        }
        if (data.longitude !== undefined) {
            data.longitude =
                data.longitude !== null && data.longitude !== '' ? Number(data.longitude) : null;
        }
        Object.assign(campaign, data);
        const updated = await this.campaignRepo.save(campaign);
        return updated.toObject();
    }
    async delete(id, userId, userRole) {
        const campaign = await this.campaignRepo.findOne({ where: { id } });
        if (!campaign)
            throw new common_1.NotFoundException('Kampanya bulunamadı');
        const canDelete = campaign.userId === userId || ['admin', 'super_admin', 'moderator'].includes(userRole);
        if (!canDelete)
            throw new common_1.ForbiddenException('Bu kampanyayı silme yetkiniz yok');
        await this.campaignRepo.delete(id);
        return { success: true };
    }
    async claimCode(id, userId) {
        const campaign = await this.campaignRepo.findOne({ where: { id } });
        if (!campaign)
            throw new common_1.NotFoundException('Kampanya bulunamadı');
        if (campaign.maxClaims && campaign.currentClaims >= campaign.maxClaims) {
            throw new common_1.BadRequestException('Bu kampanyanın kupon kotası dolmuştur.');
        }
        const existing = await this.codeRepo.findOne({
            where: { campaignId: id, userId },
        });
        if (existing) {
            return { code: existing.code };
        }
        const randomNum = Math.floor(10000 + Math.random() * 90000);
        const codeStr = `CIVAR-${randomNum}`;
        const newCode = this.codeRepo.create({
            campaignId: id,
            userId,
            code: codeStr,
        });
        await this.codeRepo.save(newCode);
        campaign.currentClaims = (campaign.currentClaims || 0) + 1;
        await this.campaignRepo.save(campaign);
        return { code: codeStr };
    }
    async getMyCodes(userId) {
        const codes = await this.codeRepo.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
        const campaignIds = codes.map((c) => c.campaignId);
        const campaigns = campaignIds.length > 0 ? await this.campaignRepo.findBy({ id: (0, typeorm_2.In)(campaignIds) }) : [];
        const campaignMap = new Map(campaigns.map((c) => [c.id, c.toObject()]));
        return codes.map((c) => ({
            ...c,
            campaign: campaignMap.get(c.campaignId) || null,
        }));
    }
    async toggleLike(id, userId) {
        const campaign = await this.campaignRepo.findOne({ where: { id } });
        if (!campaign)
            throw new common_1.NotFoundException('Kampanya bulunamadı');
        const likes = campaign.likes || [];
        const index = likes.indexOf(userId);
        let liked = false;
        if (index > -1) {
            likes.splice(index, 1);
        }
        else {
            likes.push(userId);
            liked = true;
        }
        campaign.likes = likes;
        await this.campaignRepo.save(campaign);
        return { liked, likeCount: likes.length };
    }
    async getComments(id) {
        const comments = await this.commentRepo.find({
            where: { itemId: id, itemType: 'campaign' },
            order: { createdAt: 'DESC' },
        });
        const userIds = [...new Set(comments.map((c) => c.userId))];
        const users = userIds.length > 0 ? await this.userRepo.findBy({ id: (0, typeorm_2.In)(userIds) }) : [];
        const userMap = new Map(users.map((u) => [u.id, u]));
        return comments.map((c) => {
            const u = userMap.get(c.userId);
            return {
                id: c.id,
                _id: c.id,
                text: c.text,
                createdAt: c.createdAt,
                user: u
                    ? {
                        id: u.id,
                        _id: u.id,
                        fullName: u.fullName,
                        profileImage: u.avatar,
                    }
                    : { id: c.userId, _id: c.userId, fullName: 'Kullanıcı' },
            };
        });
    }
    async addComment(id, userId, text) {
        const campaign = await this.campaignRepo.findOne({ where: { id } });
        if (!campaign)
            throw new common_1.NotFoundException('Kampanya bulunamadı');
        const comment = this.commentRepo.create({
            itemId: id,
            itemType: 'campaign',
            userId,
            text,
        });
        const saved = await this.commentRepo.save(comment);
        campaign.commentCount = (campaign.commentCount || 0) + 1;
        await this.campaignRepo.save(campaign);
        const user = await this.userRepo.findOne({ where: { id: userId } });
        return {
            id: saved.id,
            _id: saved.id,
            text: saved.text,
            createdAt: saved.createdAt,
            user: user
                ? {
                    id: user.id,
                    _id: user.id,
                    fullName: user.fullName,
                    profileImage: user.avatar,
                }
                : { id: userId, _id: userId, fullName: 'Kullanıcı' },
        };
    }
};
exports.CampaignsService = CampaignsService;
exports.CampaignsService = CampaignsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(campaign_entity_1.Campaign)),
    __param(1, (0, typeorm_1.InjectRepository)(claimed_code_entity_1.ClaimedCode)),
    __param(2, (0, typeorm_1.InjectRepository)(item_comment_entity_1.ItemComment)),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], CampaignsService);
//# sourceMappingURL=campaigns.service.js.map