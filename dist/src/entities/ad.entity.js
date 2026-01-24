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
exports.AdSchema = exports.Ad = exports.AdStatus = exports.AdType = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
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
let Ad = class Ad extends mongoose_2.Document {
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
};
exports.Ad = Ad;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Ad.prototype, "title", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: AdType }),
    __metadata("design:type", String)
], Ad.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Ad.prototype, "mediaUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Ad.prototype, "linkUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Ad.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: AdStatus, default: AdStatus.DRAFT }),
    __metadata("design:type", String)
], Ad.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], Ad.prototype, "startDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], Ad.prototype, "endDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Ad.prototype, "clickCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Ad.prototype, "viewCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Ad.prototype, "impressionCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, ref: 'User' }),
    __metadata("design:type", String)
], Ad.prototype, "createdBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Ad.prototype, "maxImpressions", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Ad.prototype, "budget", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Ad.prototype, "spentAmount", void 0);
exports.Ad = Ad = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Ad);
exports.AdSchema = mongoose_1.SchemaFactory.createForClass(Ad);
exports.AdSchema.index({ status: 1, startDate: 1, endDate: 1 });
exports.AdSchema.index({ createdBy: 1 });
exports.AdSchema.index({ createdAt: -1 });
//# sourceMappingURL=ad.entity.js.map