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
exports.Report = exports.ReportPriority = exports.ReportStatus = exports.ReportReason = exports.ReportType = void 0;
const typeorm_1 = require("typeorm");
var ReportType;
(function (ReportType) {
    ReportType["USER"] = "user";
    ReportType["POST"] = "post";
    ReportType["COMMENT"] = "comment";
    ReportType["MESSAGE"] = "message";
})(ReportType || (exports.ReportType = ReportType = {}));
var ReportReason;
(function (ReportReason) {
    ReportReason["SPAM"] = "spam";
    ReportReason["HARASSMENT"] = "harassment";
    ReportReason["INAPPROPRIATE_CONTENT"] = "inappropriate_content";
    ReportReason["COPYRIGHT"] = "copyright";
    ReportReason["FAKE_NEWS"] = "fake_news";
    ReportReason["HATE_SPEECH"] = "hate_speech";
    ReportReason["OTHER"] = "other";
})(ReportReason || (exports.ReportReason = ReportReason = {}));
var ReportStatus;
(function (ReportStatus) {
    ReportStatus["PENDING"] = "pending";
    ReportStatus["IN_REVIEW"] = "in_review";
    ReportStatus["RESOLVED"] = "resolved";
    ReportStatus["REJECTED"] = "rejected";
})(ReportStatus || (exports.ReportStatus = ReportStatus = {}));
var ReportPriority;
(function (ReportPriority) {
    ReportPriority["LOW"] = "low";
    ReportPriority["MEDIUM"] = "medium";
    ReportPriority["HIGH"] = "high";
    ReportPriority["URGENT"] = "urgent";
})(ReportPriority || (exports.ReportPriority = ReportPriority = {}));
let Report = class Report {
    id;
    reporterId;
    reportedId;
    type;
    reason;
    description;
    status;
    priority;
    reviewedBy;
    reviewedAt;
    adminNote;
    reportCount;
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
exports.Report = Report;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Report.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], Report.prototype, "reporterId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], Report.prototype, "reportedId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], Report.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], Report.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', default: '' }),
    __metadata("design:type", String)
], Report.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: ReportStatus.PENDING }),
    __metadata("design:type", String)
], Report.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: ReportPriority.MEDIUM }),
    __metadata("design:type", String)
], Report.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, nullable: true, default: null }),
    __metadata("design:type", Object)
], Report.prototype, "reviewedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone', nullable: true, default: null }),
    __metadata("design:type", Object)
], Report.prototype, "reviewedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', default: '' }),
    __metadata("design:type", String)
], Report.prototype, "adminNote", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1 }),
    __metadata("design:type", Number)
], Report.prototype, "reportCount", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp with time zone' }),
    __metadata("design:type", Date)
], Report.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp with time zone' }),
    __metadata("design:type", Date)
], Report.prototype, "updatedAt", void 0);
exports.Report = Report = __decorate([
    (0, typeorm_1.Entity)('reports'),
    (0, typeorm_1.Index)(['status', 'priority', 'createdAt']),
    (0, typeorm_1.Index)(['reportedId', 'type']),
    (0, typeorm_1.Index)(['reporterId']),
    (0, typeorm_1.Index)(['reviewedBy'])
], Report);
//# sourceMappingURL=report.entity.js.map