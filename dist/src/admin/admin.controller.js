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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const jwt_guard_1 = require("../guards/jwt.guard");
const admin_guard_1 = require("../common/guards/admin.guard");
const moderator_guard_1 = require("../common/guards/moderator.guard");
const user_decorator_1 = require("../common/decorators/user.decorator");
const user_entity_1 = require("../entities/user.entity");
const admin_service_1 = require("./admin.service");
const ban_user_dto_1 = require("./dto/ban-user.dto");
const change_role_dto_1 = require("./dto/change-role.dto");
const activity_log_entity_1 = require("../entities/activity-log.entity");
let AdminController = class AdminController {
    adminService;
    constructor(adminService) {
        this.adminService = adminService;
    }
    async getDashboard() {
        return this.adminService.getDashboardStatistics();
    }
    async getUsers(page = 1, limit = 20, search, role, isBanned) {
        const isBannedBool = isBanned === 'true' ? true : isBanned === 'false' ? false : undefined;
        return this.adminService.getUsers(page, limit, search, role, isBannedBool);
    }
    async getUserById(id) {
        return this.adminService.getUserById(id);
    }
    async banUser(id, banUserDto, admin) {
        return this.adminService.banUser(id, admin._id.toString(), banUserDto);
    }
    async unbanUser(id, admin) {
        return this.adminService.unbanUser(id, admin._id.toString());
    }
    async warnUser(id, body, admin) {
        return this.adminService.warnUser(id, admin._id.toString(), body.reason);
    }
    async changeUserRole(id, changeRoleDto, admin) {
        return this.adminService.changeUserRole(id, admin._id.toString(), changeRoleDto);
    }
    async deletePost(id, body, admin) {
        return this.adminService.deletePost(id, admin._id.toString(), body.reason);
    }
    async getActivityLogs(page = 1, limit = 20, adminId, activityType) {
        return this.adminService.getActivityLogs(page, limit, adminId, activityType);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, moderator_guard_1.ModeratorGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('users'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, moderator_guard_1.ModeratorGuard),
    __param(0, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('role')),
    __param(4, (0, common_1.Query)('isBanned')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUsers", null);
__decorate([
    (0, common_1.Get)('users/:id'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, moderator_guard_1.ModeratorGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUserById", null);
__decorate([
    (0, common_1.Post)('users/:id/ban'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, moderator_guard_1.ModeratorGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ban_user_dto_1.BanUserDto,
        user_entity_1.User]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "banUser", null);
__decorate([
    (0, common_1.Post)('users/:id/unban'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, moderator_guard_1.ModeratorGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "unbanUser", null);
__decorate([
    (0, common_1.Post)('users/:id/warn'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, moderator_guard_1.ModeratorGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "warnUser", null);
__decorate([
    (0, common_1.Put)('users/:id/role'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, admin_guard_1.AdminGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, change_role_dto_1.ChangeRoleDto,
        user_entity_1.User]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "changeUserRole", null);
__decorate([
    (0, common_1.Delete)('posts/:id'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, moderator_guard_1.ModeratorGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deletePost", null);
__decorate([
    (0, common_1.Get)('activity-logs'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, admin_guard_1.AdminGuard),
    __param(0, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('adminId')),
    __param(3, (0, common_1.Query)('activityType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getActivityLogs", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map