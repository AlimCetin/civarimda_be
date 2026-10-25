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
exports.Appeal = exports.AppealStatus = void 0;
const typeorm_1 = require("typeorm");
var AppealStatus;
(function (AppealStatus) {
    AppealStatus["PENDING"] = "pending";
    AppealStatus["APPROVED"] = "approved";
    AppealStatus["REJECTED"] = "rejected";
})(AppealStatus || (exports.AppealStatus = AppealStatus = {}));
let Appeal = class Appeal {
    id;
    userId;
    banLogId;
    reason;
    status;
    reviewedBy;
    reviewedAt;
    adminResponse;
    conversation;
    createdAt;
    updatedAt;
    populateVirtuals() {
        if (!this.conversation)
            this.conversation = [];
    }
    toObject() {
        return {
            ...this,
            id: this.id,
            _id: this.id,
            conversation: this.conversation || [],
        };
    }
};
exports.Appeal = Appeal;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Appeal.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], Appeal.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], Appeal.prototype, "banLogId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Appeal.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: AppealStatus.PENDING }),
    __metadata("design:type", String)
], Appeal.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, nullable: true, default: null }),
    __metadata("design:type", Object)
], Appeal.prototype, "reviewedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone', nullable: true, default: null }),
    __metadata("design:type", Object)
], Appeal.prototype, "reviewedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', default: '' }),
    __metadata("design:type", String)
], Appeal.prototype, "adminResponse", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: '[]' }),
    __metadata("design:type", Array)
], Appeal.prototype, "conversation", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp with time zone' }),
    __metadata("design:type", Date)
], Appeal.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp with time zone' }),
    __metadata("design:type", Date)
], Appeal.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.AfterLoad)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Appeal.prototype, "populateVirtuals", null);
exports.Appeal = Appeal = __decorate([
    (0, typeorm_1.Entity)('appeals'),
    (0, typeorm_1.Index)(['userId', 'status', 'createdAt']),
    (0, typeorm_1.Index)(['reviewedBy']),
    (0, typeorm_1.Index)(['status', 'createdAt'])
], Appeal);
//# sourceMappingURL=appeal.entity.js.map