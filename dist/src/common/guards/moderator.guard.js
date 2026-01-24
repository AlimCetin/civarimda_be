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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModeratorGuard = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_entity_1 = require("../../entities/user.entity");
let ModeratorGuard = class ModeratorGuard {
    userModel;
    constructor(userModel) {
        this.userModel = userModel;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            throw new common_1.ForbiddenException('User not authenticated');
        }
        const userDoc = await this.userModel.findById(user._id || user.id).select('role');
        if (!userDoc) {
            throw new common_1.ForbiddenException('User not found');
        }
        const allowedRoles = ['admin', 'super_admin', 'moderator'];
        if (!allowedRoles.includes(userDoc.role)) {
            throw new common_1.ForbiddenException('Moderator access required');
        }
        return true;
    }
};
exports.ModeratorGuard = ModeratorGuard;
exports.ModeratorGuard = ModeratorGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_entity_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], ModeratorGuard);
//# sourceMappingURL=moderator.guard.js.map