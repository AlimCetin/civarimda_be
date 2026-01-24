"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagesModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const messages_controller_1 = require("./messages.controller");
const messages_service_1 = require("./messages.service");
const messages_gateway_1 = require("./messages.gateway");
const conversation_entity_1 = require("../entities/conversation.entity");
const message_entity_1 = require("../entities/message.entity");
const user_entity_1 = require("../entities/user.entity");
const notification_entity_1 = require("../entities/notification.entity");
let MessagesModule = class MessagesModule {
};
exports.MessagesModule = MessagesModule;
exports.MessagesModule = MessagesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: conversation_entity_1.Conversation.name, schema: conversation_entity_1.ConversationSchema },
                { name: message_entity_1.Message.name, schema: message_entity_1.MessageSchema },
                { name: user_entity_1.User.name, schema: user_entity_1.UserSchema },
                { name: notification_entity_1.Notification.name, schema: notification_entity_1.NotificationSchema },
            ]),
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => {
                    const secret = configService.get('JWT_SECRET');
                    if (!secret) {
                        throw new Error('JWT_SECRET environment variable is required');
                    }
                    return {
                        secret,
                    };
                },
            }),
        ],
        controllers: [messages_controller_1.MessagesController],
        providers: [messages_service_1.MessagesService, messages_gateway_1.MessagesGateway],
    })
], MessagesModule);
//# sourceMappingURL=messages.module.js.map