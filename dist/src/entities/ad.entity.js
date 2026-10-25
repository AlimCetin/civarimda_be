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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ad = exports.AdStatus = exports.AdType = void 0;
const typeorm_1 = require("typeorm");
var AdType;
(function (AdType) {
    AdType["IMAGE"] = "image";
    AdType["VIDEO"] = "video";
})(AdType || (exports.AdType = AdType = {}));
var AdStatus;
(function (AdStatus) {
    AdStatus["ACTIVE"] = "active";
    AdStatus["PAUSED"] = "paused";
    AdStatus["EXPIRED"] = "expired";
    AdStatus["DRAFT"] = "draft";
})(AdStatus || (exports.AdStatus = AdStatus = {}));
let Ad = class Ad {
    id;
    title;
    type;
    mediaUrl;
    linkUrl;
    description;
    status;
    startDate;
    endDate;
    clickCount;
    viewCount;
    impressionCount;
    createdBy;
    maxImpressions;
    budget;
    spentAmount;
    createdAt;
    updatedAt;
    toObject() {
        return {
            ...this,
            id: this.id,
            _id: this.id,
        };
    }
};
exports.Ad = Ad;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Ad.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Ad.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], Ad.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500 }),
    __metadata("design:type", String)
], Ad.prototype, "mediaUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500 }),
    __metadata("design:type", String)
], Ad.prototype, "linkUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', default: '' }),
    __metadata("design:type", String)
], Ad.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: AdStatus.DRAFT }),
    __metadata("design:type", String)
], Ad.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone' }),
    __metadata("design:type", Date)
], Ad.prototype, "startDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone' }),
    __metadata("design:type", Date)
], Ad.prototype, "endDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Ad.prototype, "clickCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Ad.prototype, "viewCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Ad.prototype, "impressionCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, nullable: true, default: null }),
    __metadata("design:type", Object)
], Ad.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Ad.prototype, "maxImpressions", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Ad.prototype, "budget", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Ad.prototype, "spentAmount", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp with time zone' }),
    __metadata("design:type", Date)
], Ad.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp with time zone' }),
    __metadata("design:type", Date)
], Ad.prototype, "updatedAt", void 0);
exports.Ad = Ad = __decorate([
    (0, typeorm_1.Entity)('ads'),
    (0, typeorm_1.Index)(['status', 'startDate', 'endDate']),
    (0, typeorm_1.Index)(['createdBy']),
    (0, typeorm_1.Index)(['createdAt'])
], Ad);
//# sourceMappingURL=ad.entity.js.map