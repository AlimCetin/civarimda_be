"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const admin_controller_1 = require("./admin.controller");
const admin_service_1 = require("./admin.service");
const user_entity_1 = require("../entities/user.entity");
const activity_log_entity_1 = require("../entities/activity-log.entity");
const post_entity_1 = require("../entities/post.entity");
const admin_guard_1 = require("../common/guards/admin.guard");
const moderator_guard_1 = require("../common/guards/moderator.guard");
let AdminModule = class AdminModule {
};
exports.AdminModule = AdminModule;
exports.AdminModule = AdminModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: user_entity_1.User.name, schema: user_entity_1.UserSchema },
                { name: activity_log_entity_1.ActivityLog.name, schema: activity_log_entity_1.ActivityLogSchema },
                { name: post_entity_1.Post.name, schema: post_entity_1.PostSchema },
            ]),
        ],
        controllers: [admin_controller_1.AdminController],
        providers: [admin_service_1.AdminService, admin_guard_1.AdminGuard, moderator_guard_1.ModeratorGuard],
        exports: [admin_service_1.AdminService],
    })
], AdminModule);
//# sourceMappingURL=admin.module.js.map