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
exports.MessagesController = void 0;
const common_1 = require("@nestjs/common");
const messages_service_1 = require("./messages.service");
const jwt_guard_1 = require("../guards/jwt.guard");
const user_decorator_1 = require("../common/decorators/user.decorator");
const user_entity_1 = require("../entities/user.entity");
let MessagesController = class MessagesController {
    messagesService;
    constructor(messagesService) {
        this.messagesService = messagesService;
    }
    async getConversations(user, page, limit) {
        return this.messagesService.getConversations(user._id.toString(), page, limit);
    }
    async getMessages(conversationId, user, page, limit) {
        return this.messagesService.getMessages(conversationId, user._id.toString(), page, limit);
    }
    async sendMessage(body, user) {
        return this.messagesService.sendMessage(user._id.toString(), body.receiverId, body.text);
    }
    async markAsRead(conversationId, user) {
        const result = await this.messagesService.markAsRead(conversationId, user._id.toString());
        return { message: 'Marked as read', modifiedCount: result.modifiedCount };
    }
    async getUnreadCount(user) {
        const count = await this.messagesService.getUnreadMessagesCount(user._id.toString());
        return { count };
    }
};
exports.MessagesController = MessagesController;
__decorate([
    (0, common_1.Get)('conversations'),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User, Number, Number]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "getConversations", null);
__decorate([
    (0, common_1.Get)(':conversationId'),
    __param(0, (0, common_1.Param)('conversationId')),
    __param(1, (0, user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(3, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User, Number, Number]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "getMessages", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Put)(':conversationId/read'),
    __param(0, (0, common_1.Param)('conversationId')),
    __param(1, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "markAsRead", null);
__decorate([
    (0, common_1.Get)('unread/count'),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "getUnreadCount", null);
exports.MessagesController = MessagesController = __decorate([
    (0, common_1.Controller)('messages'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [messages_service_1.MessagesService])
], MessagesController);
//# sourceMappingURL=messages.controller.js.map