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
exports.ActivityLogSchema = exports.ActivityLog = exports.ActivityType = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
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
let ActivityLog = class ActivityLog extends mongoose_2.Document {
    adminId;
    activityType;
    targetUserId;
    targetPostId;
    targetReportId;
    targetAdId;
    description;
    metadata;
};
exports.ActivityLog = ActivityLog;
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: String, ref: 'User' }),
    __metadata("design:type", String)
], ActivityLog.prototype, "adminId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ActivityType }),
    __metadata("design:type", String)
], ActivityLog.prototype, "activityType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, ref: 'User', default: null }),
    __metadata("design:type", String)
], ActivityLog.prototype, "targetUserId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, ref: 'Post', default: null }),
    __metadata("design:type", String)
], ActivityLog.prototype, "targetPostId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, ref: 'Report', default: null }),
    __metadata("design:type", String)
], ActivityLog.prototype, "targetReportId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, ref: 'Ad', default: null }),
    __metadata("design:type", String)
], ActivityLog.prototype, "targetAdId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], ActivityLog.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: {} }),
    __metadata("design:type", Object)
], ActivityLog.prototype, "metadata", void 0);
exports.ActivityLog = ActivityLog = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], ActivityLog);
exports.ActivityLogSchema = mongoose_1.SchemaFactory.createForClass(ActivityLog);
exports.ActivityLogSchema.index({ adminId: 1, createdAt: -1 });
exports.ActivityLogSchema.index({ targetUserId: 1, createdAt: -1 });
exports.ActivityLogSchema.index({ activityType: 1, createdAt: -1 });
exports.ActivityLogSchema.index({ createdAt: -1 });
//# sourceMappingURL=activity-log.entity.js.map