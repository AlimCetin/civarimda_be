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
exports.AdsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_guard_1 = require("../guards/jwt.guard");
const admin_guard_1 = require("../common/guards/admin.guard");
const user_decorator_1 = require("../common/decorators/user.decorator");
const user_entity_1 = require("../entities/user.entity");
const ads_service_1 = require("./ads.service");
const create_ad_dto_1 = require("./dto/create-ad.dto");
const update_ad_dto_1 = require("./dto/update-ad.dto");
const ad_entity_1 = require("../entities/ad.entity");
let AdsController = class AdsController {
    adsService;
    constructor(adsService) {
        this.adsService = adsService;
    }
    async create(createAdDto, admin) {
        return this.adsService.create(createAdDto, admin._id.toString());
    }
    async findAll(status, page = 1, limit = 20) {
        return this.adsService.findAll(status, page, limit);
    }
    async getActiveAds() {
        return this.adsService.getActiveAds();
    }
    async getStatistics(adId) {
        return this.adsService.getStatistics(adId);
    }
    async findOne(id) {
        return this.adsService.findOne(id);
    }
    async update(id, updateAdDto, admin) {
        return this.adsService.update(id, updateAdDto, admin._id.toString());
    }
    async delete(id, admin) {
        return this.adsService.delete(id, admin._id.toString());
    }
    async recordImpression(id) {
        await this.adsService.recordImpression(id);
        return { success: true };
    }
    async recordClick(id) {
        await this.adsService.recordClick(id);
        return { success: true };
    }
    async recordView(id) {
        await this.adsService.recordView(id);
        return { success: true };
    }
};
exports.AdsController = AdsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, admin_guard_1.AdminGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_ad_dto_1.CreateAdDto, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], AdsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, admin_guard_1.AdminGuard),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], AdsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('active'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdsController.prototype, "getActiveAds", null);
__decorate([
    (0, common_1.Get)('statistics'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, admin_guard_1.AdminGuard),
    __param(0, (0, common_1.Query)('adId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdsController.prototype, "getStatistics", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, admin_guard_1.AdminGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, admin_guard_1.AdminGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_ad_dto_1.UpdateAdDto,
        user_entity_1.User]),
    __metadata("design:returntype", Promise)
], AdsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, admin_guard_1.AdminGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], AdsController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)(':id/impression'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdsController.prototype, "recordImpression", null);
__decorate([
    (0, common_1.Post)(':id/click'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdsController.prototype, "recordClick", null);
__decorate([
    (0, common_1.Post)(':id/view'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdsController.prototype, "recordView", null);
exports.AdsController = AdsController = __decorate([
    (0, common_1.Controller)('ads'),
    __metadata("design:paramtypes", [ads_service_1.AdsService])
], AdsController);
//# sourceMappingURL=ads.controller.js.map