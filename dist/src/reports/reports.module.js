"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const reports_controller_1 = require("./reports.controller");
const reports_service_1 = require("./reports.service");
const report_entity_1 = require("../entities/report.entity");
const post_entity_1 = require("../entities/post.entity");
const user_entity_1 = require("../entities/user.entity");
const comment_entity_1 = require("../entities/comment.entity");
const message_entity_1 = require("../entities/message.entity");
const moderator_guard_1 = require("../common/guards/moderator.guard");
let ReportsModule = class ReportsModule {
};
exports.ReportsModule = ReportsModule;
exports.ReportsModule = ReportsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: report_entity_1.Report.name, schema: report_entity_1.ReportSchema },
                { name: post_entity_1.Post.name, schema: post_entity_1.PostSchema },
                { name: user_entity_1.User.name, schema: user_entity_1.UserSchema },
                { name: comment_entity_1.Comment.name, schema: comment_entity_1.CommentSchema },
                { name: message_entity_1.Message.name, schema: message_entity_1.MessageSchema },
            ]),
        ],
        controllers: [reports_controller_1.ReportsController],
        providers: [reports_service_1.ReportsService, moderator_guard_1.ModeratorGuard],
        exports: [reports_service_1.ReportsService],
    })
], ReportsModule);
//# sourceMappingURL=reports.module.js.map