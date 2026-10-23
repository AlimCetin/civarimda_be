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
exports.ActivityLog = exports.ActivityType = void 0;
const typeorm_1 = require("typeorm");
const crypto_1 = require("crypto");
var ActivityType;
(function (ActivityType) {
    ActivityType["USER_BANNED"] = "user_banned";
    ActivityType["USER_UNBANNED"] = "user_unbanned";
    ActivityType["USER_WARNED"] = "user_warned";
    ActivityType["POST_DELETED"] = "post_deleted";
    ActivityType["POST_HIDDEN"] = "post_hidden";
    ActivityType["REPORT_RESOLVED"] = "report_resolved";
    ActivityType["REPORT_REJECTED"] = "report_rejected";
    ActivityType["AD_CREATED"] = "ad_created";
    ActivityType["AD_UPDATED"] = "ad_updated";
    ActivityType["AD_DELETED"] = "ad_deleted";
    ActivityType["ROLE_CHANGED"] = "role_changed";
})(ActivityType || (exports.ActivityType = ActivityType = {}));
let ActivityLog = class ActivityLog {
    id;
    get _id() {
        return this.id;
    }
    adminId;
    activityType;
    targetUserId;
    targetPostId;
    targetReportId;
    targetAdId;
    description;
    metadata;
    createdAt;
    updatedAt;
    generateId() {
        if (!this.id) {
            this.id = (0, crypto_1.randomUUID)();
        }
    }
    populateVirtuals() {
        this._id = this.id;
        if (!this.metadata)
            this.metadata = {};
    }
    toObject() {
        return {
            ...this,
            _id: this.id,
            metadata: this.metadata || {},
        };
    }
};
exports.ActivityLog = ActivityLog;
__decorate([
    (0, typeorm_1.PrimaryColumn)('varchar', { length: 64 }),
    __metadata("design:type", String)
], ActivityLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], ActivityLog.prototype, "adminId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], ActivityLog.prototype, "activityType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, nullable: true, default: null }),
    __metadata("design:type", Object)
], ActivityLog.prototype, "targetUserId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, nullable: true, default: null }),
    __metadata("design:type", Object)
], ActivityLog.prototype, "targetPostId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, nullable: true, default: null }),
    __metadata("design:type", Object)
], ActivityLog.prototype, "targetReportId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, nullable: true, default: null }),
    __metadata("design:type", Object)
], ActivityLog.prototype, "targetAdId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', default: '' }),
    __metadata("design:type", String)
], ActivityLog.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: '{}' }),
    __metadata("design:type", Object)
], ActivityLog.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp with time zone' }),
    __metadata("design:type", Date)
], ActivityLog.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp with time zone' }),
    __metadata("design:type", Date)
], ActivityLog.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.BeforeInsert)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ActivityLog.prototype, "generateId", null);
__decorate([
    (0, typeorm_1.AfterLoad)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ActivityLog.prototype, "populateVirtuals", null);
exports.ActivityLog = ActivityLog = __decorate([
    (0, typeorm_1.Entity)('activity_logs'),
    (0, typeorm_1.Index)(['adminId', 'createdAt']),
    (0, typeorm_1.Index)(['targetUserId', 'createdAt']),
    (0, typeorm_1.Index)(['activityType', 'createdAt']),
    (0, typeorm_1.Index)(['createdAt'])
], ActivityLog);
//# sourceMappingURL=activity-log.entity.js.map