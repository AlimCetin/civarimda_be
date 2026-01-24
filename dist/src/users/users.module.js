"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const users_controller_1 = require("./users.controller");
const users_service_1 = require("./users.service");
const user_entity_1 = require("../entities/user.entity");
const user_credentials_entity_1 = require("../entities/user-credentials.entity");
const post_entity_1 = require("../entities/post.entity");
const comment_entity_1 = require("../entities/comment.entity");
const conversation_entity_1 = require("../entities/conversation.entity");
const message_entity_1 = require("../entities/message.entity");
const notification_entity_1 = require("../entities/notification.entity");
const not_blocked_guard_1 = require("../common/guards/not-blocked.guard");
let UsersModule = class UsersModule {
};
exports.UsersModule = UsersModule;
exports.UsersModule = UsersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: user_entity_1.User.name, schema: user_entity_1.UserSchema },
                { name: user_credentials_entity_1.UserCredentials.name, schema: user_credentials_entity_1.UserCredentialsSchema },
                { name: post_entity_1.Post.name, schema: post_entity_1.PostSchema },
                { name: comment_entity_1.Comment.name, schema: comment_entity_1.CommentSchema },
                { name: conversation_entity_1.Conversation.name, schema: conversation_entity_1.ConversationSchema },
                { name: message_entity_1.Message.name, schema: message_entity_1.MessageSchema },
                { name: notification_entity_1.Notification.name, schema: notification_entity_1.NotificationSchema },
            ]),
        ],
        controllers: [users_controller_1.UsersController],
        providers: [users_service_1.UsersService, not_blocked_guard_1.NotBlockedGuard],
        exports: [users_service_1.UsersService],
    })
], UsersModule);
//# sourceMappingURL=users.module.js.map