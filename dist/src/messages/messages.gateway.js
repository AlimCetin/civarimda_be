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
exports.MessagesGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_entity_1 = require("../entities/user.entity");
const messages_service_1 = require("./messages.service");
let MessagesGateway = class MessagesGateway {
    jwtService;
    userModel;
    messagesService;
    configService;
    server;
    constructor(jwtService, userModel, messagesService, configService) {
        this.jwtService = jwtService;
        this.userModel = userModel;
        this.messagesService = messagesService;
        this.configService = configService;
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
            if (!token) {
                client.disconnect();
                return;
            }
            const secret = this.configService.get('JWT_SECRET');
            if (!secret) {
                client.disconnect();
                return;
            }
            const payload = this.jwtService.verify(token, { secret });
            const user = await this.userModel.findById(payload.id);
            if (!user) {
                client.disconnect();
                return;
            }
            client.data.userId = user._id.toString();
            client.join(`user_${user._id}`);
        }
        catch (error) {
            client.disconnect();
        }
    }
    async handleMessage(client, data) {
        const message = await this.messagesService.sendMessage(client.data.userId, data.receiverId, data.text);
        this.server.to(`user_${data.receiverId}`).emit('newMessage', message);
        return message;
    }
};
exports.MessagesGateway = MessagesGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], MessagesGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('sendMessage'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], MessagesGateway.prototype, "handleMessage", null);
exports.MessagesGateway = MessagesGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:19006', 'http://10.0.2.2:3000'],
            credentials: true,
        },
    }),
    __param(1, (0, mongoose_1.InjectModel)(user_entity_1.User.name)),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        mongoose_2.Model,
        messages_service_1.MessagesService,
        config_1.ConfigService])
], MessagesGateway);
//# sourceMappingURL=messages.gateway.js.map