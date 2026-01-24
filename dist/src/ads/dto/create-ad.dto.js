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
exports.CreateAdDto = void 0;
const class_validator_1 = require("class-validator");
const ad_entity_1 = require("../../entities/ad.entity");
class CreateAdDto {
    title;
    type;
    mediaUrl;
    linkUrl;
    description;
    startDate;
    endDate;
    maxImpressions;
    budget;
    status;
}
exports.CreateAdDto = CreateAdDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200, { message: 'Title must be at most 200 characters' }),
    __metadata("design:type", String)
], CreateAdDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(ad_entity_1.AdType),
    __metadata("design:type", String)
], CreateAdDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsUrl)({}, { message: 'Media URL must be a valid URL' }),
    __metadata("design:type", String)
], CreateAdDto.prototype, "mediaUrl", void 0);
__decorate([
    (0, class_validator_1.IsUrl)({}, { message: 'Link URL must be a valid URL' }),
    __metadata("design:type", String)
], CreateAdDto.prototype, "linkUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500, { message: 'Description must be at most 500 characters' }),
    __metadata("design:type", String)
], CreateAdDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateAdDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateAdDto.prototype, "endDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateAdDto.prototype, "maxImpressions", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateAdDto.prototype, "budget", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(ad_entity_1.AdStatus),
    __metadata("design:type", String)
], CreateAdDto.prototype, "status", void 0);
//# sourceMappingURL=create-ad.dto.js.map