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
exports.FeedbackController = void 0;
const common_1 = require("@nestjs/common");
const feedback_service_1 = require("./feedback.service");
const jwt_guard_1 = require("../guards/jwt.guard");
const user_decorator_1 = require("../common/decorators/user.decorator");
const user_entity_1 = require("../entities/user.entity");
let FeedbackController = class FeedbackController {
    feedbackService;
    constructor(feedbackService) {
        this.feedbackService = feedbackService;
    }
    async submitFeedback(body, req) {
        const userId = req.user?.id || null;
        const userName = req.user?.fullName || body.userName || 'Kullanıcı';
        const userEmail = req.user?.email || body.userEmail || '';
        return this.feedbackService.create({
            userId,
            userName,
            userEmail,
            rating: body.rating,
            type: body.type,
            title: body.title,
            message: body.message,
            deviceInfo: body.deviceInfo,
        });
    }
    async getFeedbacks(status, type, user) {
        if (user && !['admin', 'super_admin', 'moderator'].includes(user.role)) {
            throw new common_1.ForbiddenException('Yetkisiz erişim');
        }
        return this.feedbackService.findAll(status, type);
    }
    async getFeedbackStats(user) {
        if (user && !['admin', 'super_admin', 'moderator'].includes(user.role)) {
            throw new common_1.ForbiddenException('Yetkisiz erişim');
        }
        return this.feedbackService.getStats();
    }
    async updateStatus(id, body, user) {
        if (user && !['admin', 'super_admin', 'moderator'].includes(user.role)) {
            throw new common_1.ForbiddenException('Yetkisiz erişim');
        }
        return this.feedbackService.updateStatus(id, body.status, body.adminNote);
    }
};
exports.FeedbackController = FeedbackController;
__decorate([
    (0, common_1.Post)('feedback'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], FeedbackController.prototype, "submitFeedback", null);
__decorate([
    (0, common_1.Get)('admin/feedback'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('type')),
    __param(2, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], FeedbackController.prototype, "getFeedbacks", null);
__decorate([
    (0, common_1.Get)('admin/feedback/stats'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User]),
    __metadata("design:returntype", Promise)
], FeedbackController.prototype, "getFeedbackStats", null);
__decorate([
    (0, common_1.Patch)('admin/feedback/:id/status'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], FeedbackController.prototype, "updateStatus", null);
exports.FeedbackController = FeedbackController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [feedback_service_1.FeedbackService])
], FeedbackController);
//# sourceMappingURL=feedback.controller.js.map