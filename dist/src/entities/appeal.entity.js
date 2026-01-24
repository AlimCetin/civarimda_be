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
exports.AppealSchema = exports.Appeal = exports.AppealStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var AppealStatus;
(function (AppealStatus) {
    AppealStatus["PENDING"] = "pending";
    AppealStatus["APPROVED"] = "approved";
    AppealStatus["REJECTED"] = "rejected";
})(AppealStatus || (exports.AppealStatus = AppealStatus = {}));
let Appeal = class Appeal extends mongoose_2.Document {
    userId;
    banLogId;
    reason;
    status;
    reviewedBy;
    reviewedAt;
    adminResponse;
    conversation;
};
exports.Appeal = Appeal;
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: String, ref: 'User' }),
    __metadata("design:type", String)
], Appeal.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: String, ref: 'ActivityLog' }),
    __metadata("design:type", String)
], Appeal.prototype, "banLogId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Appeal.prototype, "reason", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: AppealStatus, default: AppealStatus.PENDING }),
    __metadata("design:type", String)
], Appeal.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, ref: 'User', default: null }),
    __metadata("design:type", String)
], Appeal.prototype, "reviewedBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", Date)
], Appeal.prototype, "reviewedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Appeal.prototype, "adminResponse", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [{
                senderId: { type: String, ref: 'User' },
                message: String,
                createdAt: Date
            }], default: [] }),
    __metadata("design:type", Array)
], Appeal.prototype, "conversation", void 0);
exports.Appeal = Appeal = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Appeal);
exports.AppealSchema = mongoose_1.SchemaFactory.createForClass(Appeal);
exports.AppealSchema.index({ userId: 1, status: 1, createdAt: -1 });
exports.AppealSchema.index({ reviewedBy: 1 });
exports.AppealSchema.index({ status: 1, createdAt: -1 });
//# sourceMappingURL=appeal.entity.js.map