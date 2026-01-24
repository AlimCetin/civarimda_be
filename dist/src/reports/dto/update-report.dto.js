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
exports.UpdateReportDto = void 0;
const class_validator_1 = require("class-validator");
const report_entity_1 = require("../../entities/report.entity");
class UpdateReportDto {
    status;
    priority;
    adminNote;
}
exports.UpdateReportDto = UpdateReportDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(report_entity_1.ReportStatus),
    __metadata("design:type", String)
], UpdateReportDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(report_entity_1.ReportPriority),
    __metadata("design:type", String)
], UpdateReportDto.prototype, "priority", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000, { message: 'Admin note must be at most 1000 characters' }),
    __metadata("design:type", String)
], UpdateReportDto.prototype, "adminNote", void 0);
//# sourceMappingURL=update-report.dto.js.map