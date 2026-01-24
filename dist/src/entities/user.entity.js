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
exports.UserSchema = exports.User = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let User = class User extends mongoose_2.Document {
    fullName;
    avatar;
    bio;
    followers;
    following;
    blockedUsers;
    savedPosts;
    isVerified;
    hideFollowers;
    hideFollowing;
    hiddenFollowers;
    hiddenFollowing;
    role;
    warningCount;
    bannedUntil;
    isPermanentlyBanned;
    deletedAt;
};
exports.User = User;
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], User.prototype, "fullName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", String)
], User.prototype, "avatar", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], User.prototype, "bio", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [{ type: String, ref: 'User' }], default: [] }),
    __metadata("design:type", Array)
], User.prototype, "followers", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [{ type: String, ref: 'User' }], default: [] }),
    __metadata("design:type", Array)
], User.prototype, "following", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [{ type: String, ref: 'User' }], default: [] }),
    __metadata("design:type", Array)
], User.prototype, "blockedUsers", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [{ type: String, ref: 'Post' }], default: [] }),
    __metadata("design:type", Array)
], User.prototype, "savedPosts", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "isVerified", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "hideFollowers", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "hideFollowing", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [{ type: String, ref: 'User' }], default: [] }),
    __metadata("design:type", Array)
], User.prototype, "hiddenFollowers", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [{ type: String, ref: 'User' }], default: [] }),
    __metadata("design:type", Array)
], User.prototype, "hiddenFollowing", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: ['user', 'moderator', 'admin', 'super_admin'],
        default: 'user'
    }),
    __metadata("design:type", String)
], User.prototype, "role", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], User.prototype, "warningCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Object)
], User.prototype, "bannedUntil", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "isPermanentlyBanned", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Object)
], User.prototype, "deletedAt", void 0);
exports.User = User = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], User);
exports.UserSchema = mongoose_1.SchemaFactory.createForClass(User);
exports.UserSchema.index({ fullName: 1 });
exports.UserSchema.index({ role: 1 });
exports.UserSchema.index({ followers: 1 });
exports.UserSchema.index({ following: 1 });
exports.UserSchema.index({ blockedUsers: 1 });
exports.UserSchema.index({ isPermanentlyBanned: 1, bannedUntil: 1 });
//# sourceMappingURL=user.entity.js.map