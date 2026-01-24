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
exports.NotificationSchema = exports.Notification = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let Notification = class Notification extends mongoose_2.Document {
    userId;
    fromUserId;
    type;
    postId;
    postOwnerName;
    isFollowerNotification;
    read;
    deletedAt;
};
exports.Notification = Notification;
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: String, ref: 'User' }),
    __metadata("design:type", String)
], Notification.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: String, ref: 'User' }),
    __metadata("design:type", String)
], Notification.prototype, "fromUserId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ['like', 'comment', 'follow', 'message'] }),
    __metadata("design:type", String)
], Notification.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, ref: 'Post' }),
    __metadata("design:type", String)
], Notification.prototype, "postId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", String)
], Notification.prototype, "postOwnerName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Notification.prototype, "isFollowerNotification", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Notification.prototype, "read", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", Date)
], Notification.prototype, "deletedAt", void 0);
exports.Notification = Notification = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Notification);
exports.NotificationSchema = mongoose_1.SchemaFactory.createForClass(Notification);
exports.NotificationSchema.index({ userId: 1, createdAt: -1 });
exports.NotificationSchema.index({ userId: 1, read: 1 });
exports.NotificationSchema.index({ fromUserId: 1 });
//# sourceMappingURL=notification.entity.js.map