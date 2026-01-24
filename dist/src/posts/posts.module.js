"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const posts_controller_1 = require("./posts.controller");
const posts_service_1 = require("./posts.service");
const post_entity_1 = require("../entities/post.entity");
const comment_entity_1 = require("../entities/comment.entity");
const notification_entity_1 = require("../entities/notification.entity");
const user_entity_1 = require("../entities/user.entity");
const ad_entity_1 = require("../entities/ad.entity");
const not_blocked_guard_1 = require("../common/guards/not-blocked.guard");
let PostsModule = class PostsModule {
};
exports.PostsModule = PostsModule;
exports.PostsModule = PostsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: post_entity_1.Post.name, schema: post_entity_1.PostSchema },
                { name: comment_entity_1.Comment.name, schema: comment_entity_1.CommentSchema },
                { name: notification_entity_1.Notification.name, schema: notification_entity_1.NotificationSchema },
                { name: user_entity_1.User.name, schema: user_entity_1.UserSchema },
                { name: ad_entity_1.Ad.name, schema: ad_entity_1.AdSchema },
            ]),
        ],
        controllers: [posts_controller_1.PostsController],
        providers: [posts_service_1.PostsService, not_blocked_guard_1.NotBlockedGuard],
        exports: [posts_service_1.PostsService],
    })
], PostsModule);
//# sourceMappingURL=posts.module.js.map