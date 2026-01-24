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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
const jwt_guard_1 = require("../guards/jwt.guard");
const not_blocked_guard_1 = require("../common/guards/not-blocked.guard");
const user_decorator_1 = require("../common/decorators/user.decorator");
const user_entity_1 = require("../entities/user.entity");
const update_profile_dto_1 = require("./dto/update-profile.dto");
const mongoose_1 = require("mongoose");
let UsersController = class UsersController {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    async getMe(user) {
        const userObj = user.toObject();
        return {
            ...userObj,
            id: userObj._id.toString(),
            _id: userObj._id.toString(),
            followerCount: userObj.followers?.length || 0,
            followingCount: userObj.following?.length || 0,
        };
    }
    async search(query) {
        return this.usersService.search(query);
    }
    async getBlocked(user) {
        return this.usersService.getBlockedUsers(user._id.toString());
    }
    async getUser(userId, user) {
        if (userId === 'current-user-id' || userId === 'me') {
            const userObj = user.toObject();
            return {
                ...userObj,
                id: userObj._id.toString(),
                _id: userObj._id.toString(),
                followerCount: userObj.followers?.length || 0,
                followingCount: userObj.following?.length || 0,
            };
        }
        if (!mongoose_1.Types.ObjectId.isValid(userId)) {
            throw new common_1.BadRequestException('Invalid user ID format');
        }
        return this.usersService.findById(userId, user._id.toString());
    }
    async getFollowers(userId, user) {
        if (userId === 'current-user-id' || userId === 'me') {
            return this.usersService.getFollowers(user._id.toString(), user._id.toString());
        }
        if (!mongoose_1.Types.ObjectId.isValid(userId)) {
            throw new common_1.BadRequestException('Invalid user ID format');
        }
        return this.usersService.getFollowers(userId, user._id.toString());
    }
    async getFollowing(userId, user) {
        if (userId === 'current-user-id' || userId === 'me') {
            return this.usersService.getFollowing(user._id.toString(), user._id.toString());
        }
        if (!mongoose_1.Types.ObjectId.isValid(userId)) {
            throw new common_1.BadRequestException('Invalid user ID format');
        }
        return this.usersService.getFollowing(userId, user._id.toString());
    }
    async follow(userId, user) {
        if (!mongoose_1.Types.ObjectId.isValid(userId)) {
            throw new common_1.BadRequestException('Invalid user ID format');
        }
        return this.usersService.follow(userId, user._id.toString());
    }
    async unfollow(userId, user) {
        if (!mongoose_1.Types.ObjectId.isValid(userId)) {
            throw new common_1.BadRequestException('Invalid user ID format');
        }
        return this.usersService.unfollow(userId, user._id.toString());
    }
    async block(userId, user) {
        if (!mongoose_1.Types.ObjectId.isValid(userId)) {
            throw new common_1.BadRequestException('Invalid user ID format');
        }
        return this.usersService.block(userId, user._id.toString());
    }
    async unblock(userId, user) {
        if (!mongoose_1.Types.ObjectId.isValid(userId)) {
            throw new common_1.BadRequestException('Invalid user ID format');
        }
        return this.usersService.unblock(userId, user._id.toString());
    }
    async updateProfile(data, user) {
        return this.usersService.updateProfile(user._id.toString(), data);
    }
    async deleteAccount(user) {
        await this.usersService.deleteAccount(user._id.toString());
        return { message: 'Account deleted successfully' };
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getMe", null);
__decorate([
    (0, common_1.Get)('search'),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "search", null);
__decorate([
    (0, common_1.Get)('blocked/list'),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getBlocked", null);
__decorate([
    (0, common_1.Get)(':userId'),
    (0, common_1.UseGuards)(not_blocked_guard_1.NotBlockedGuard),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getUser", null);
__decorate([
    (0, common_1.Get)(':userId/followers'),
    (0, common_1.UseGuards)(not_blocked_guard_1.NotBlockedGuard),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getFollowers", null);
__decorate([
    (0, common_1.Get)(':userId/following'),
    (0, common_1.UseGuards)(not_blocked_guard_1.NotBlockedGuard),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getFollowing", null);
__decorate([
    (0, common_1.Post)(':userId/follow'),
    (0, common_1.UseGuards)(not_blocked_guard_1.NotBlockedGuard),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "follow", null);
__decorate([
    (0, common_1.Delete)(':userId/follow'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "unfollow", null);
__decorate([
    (0, common_1.Post)(':userId/block'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "block", null);
__decorate([
    (0, common_1.Delete)(':userId/block'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "unblock", null);
__decorate([
    (0, common_1.Put)('profile'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_profile_dto_1.UpdateProfileDto, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Delete)('account'),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "deleteAccount", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map