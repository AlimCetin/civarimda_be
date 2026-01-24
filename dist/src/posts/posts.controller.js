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
exports.PostsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const posts_service_1 = require("./posts.service");
const jwt_guard_1 = require("../guards/jwt.guard");
const not_blocked_guard_1 = require("../common/guards/not-blocked.guard");
const user_decorator_1 = require("../common/decorators/user.decorator");
const user_entity_1 = require("../entities/user.entity");
const create_post_dto_1 = require("./dto/create-post.dto");
const add_comment_dto_1 = require("./dto/add-comment.dto");
const update_visibility_dto_1 = require("./dto/update-visibility.dto");
const mongoose_1 = require("mongoose");
const multer_config_1 = require("../config/multer.config");
let PostsController = class PostsController {
    postsService;
    constructor(postsService) {
        this.postsService = postsService;
    }
    async uploadMedia(file) {
        if (!file) {
            throw new common_1.BadRequestException('File is not provided or invalid type');
        }
        const normalizedPath = file.path.replace(/\\/g, '/');
        const relativePath = normalizedPath.includes('uploads/')
            ? normalizedPath.substring(normalizedPath.indexOf('uploads/'))
            : normalizedPath;
        return { url: `/${relativePath}` };
    }
    async create(file, body, user) {
        let videoUrl = body.video;
        if (file) {
            const normalizedPath = file.path.replace(/\\/g, '/');
            const relativePath = normalizedPath.includes('uploads/')
                ? normalizedPath.substring(normalizedPath.indexOf('uploads/'))
                : normalizedPath;
            videoUrl = `/${relativePath}`;
        }
        return this.postsService.create(user._id.toString(), body.image, body.caption || '', body.isPrivate === 'true' || body.isPrivate === true || false, body.hiddenFromFollowers || [], videoUrl);
    }
    async getLikes(postId, user, page, limit) {
        if (!mongoose_1.Types.ObjectId.isValid(postId)) {
            throw new common_1.BadRequestException('Invalid post ID format');
        }
        return this.postsService.getLikes(postId, user._id.toString(), page, limit);
    }
    async getFeed(user, page, limit) {
        return this.postsService.getFeed(user._id.toString(), page, limit);
    }
    async getUserPosts(userId, user, page, limit) {
        if (userId === 'current-user-id' || userId === 'me') {
            return this.postsService.getUserPosts(user._id.toString(), user._id.toString(), page, limit);
        }
        if (!mongoose_1.Types.ObjectId.isValid(userId)) {
            throw new common_1.BadRequestException('Invalid user ID format');
        }
        return this.postsService.getUserPosts(userId, user._id.toString(), page, limit);
    }
    async like(postId, user) {
        return this.postsService.like(postId, user._id.toString());
    }
    async unlike(postId, user) {
        return this.postsService.unlike(postId, user._id.toString());
    }
    async getComments(postId, page, limit) {
        return this.postsService.getComments(postId, page, limit);
    }
    async addComment(postId, body, user) {
        return this.postsService.addComment(postId, user._id.toString(), body.text);
    }
    async savePost(postId, user) {
        return this.postsService.savePost(postId, user._id.toString());
    }
    async unsavePost(postId, user) {
        return this.postsService.unsavePost(postId, user._id.toString());
    }
    async getSavedPosts(user, page, limit) {
        return this.postsService.getSavedPosts(user._id.toString(), page, limit);
    }
    async getPostForShare(postId, user) {
        return this.postsService.sharePost(postId, user._id.toString(), '');
    }
    async getPost(postId, user) {
        if (!mongoose_1.Types.ObjectId.isValid(postId)) {
            throw new common_1.BadRequestException('Invalid post ID format');
        }
        return this.postsService.getPostById(postId, user._id.toString());
    }
    async hidePost(postId, user) {
        if (!mongoose_1.Types.ObjectId.isValid(postId)) {
            throw new common_1.BadRequestException('Invalid post ID format');
        }
        return this.postsService.hidePost(postId, user._id.toString());
    }
    async unhidePost(postId, user) {
        if (!mongoose_1.Types.ObjectId.isValid(postId)) {
            throw new common_1.BadRequestException('Invalid post ID format');
        }
        return this.postsService.unhidePost(postId, user._id.toString());
    }
    async updateVisibility(postId, body, user) {
        if (!mongoose_1.Types.ObjectId.isValid(postId)) {
            throw new common_1.BadRequestException('Invalid post ID format');
        }
        return this.postsService.updateVisibility(postId, user._id.toString(), body);
    }
    async deletePost(postId, user) {
        if (!mongoose_1.Types.ObjectId.isValid(postId)) {
            throw new common_1.BadRequestException('Invalid post ID format');
        }
        return this.postsService.deletePost(postId, user._id.toString());
    }
};
exports.PostsController = PostsController;
__decorate([
    (0, common_1.Post)('upload-media'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', multer_config_1.multerConfig)),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "uploadMedia", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', multer_config_1.multerConfig)),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_post_dto_1.CreatePostDto,
        user_entity_1.User]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':postId/likes'),
    __param(0, (0, common_1.Param)('postId')),
    __param(1, (0, user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(3, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User, Number, Number]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "getLikes", null);
__decorate([
    (0, common_1.Get)('feed'),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User, Number, Number]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "getFeed", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    (0, common_1.UseGuards)(not_blocked_guard_1.NotBlockedGuard),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(3, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User, Number, Number]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "getUserPosts", null);
__decorate([
    (0, common_1.Post)(':postId/like'),
    __param(0, (0, common_1.Param)('postId')),
    __param(1, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "like", null);
__decorate([
    (0, common_1.Delete)(':postId/like'),
    __param(0, (0, common_1.Param)('postId')),
    __param(1, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "unlike", null);
__decorate([
    (0, common_1.Get)(':postId/comments'),
    __param(0, (0, common_1.Param)('postId')),
    __param(1, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "getComments", null);
__decorate([
    (0, common_1.Post)(':postId/comments'),
    __param(0, (0, common_1.Param)('postId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, add_comment_dto_1.AddCommentDto, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "addComment", null);
__decorate([
    (0, common_1.Post)(':postId/save'),
    __param(0, (0, common_1.Param)('postId')),
    __param(1, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "savePost", null);
__decorate([
    (0, common_1.Delete)(':postId/save'),
    __param(0, (0, common_1.Param)('postId')),
    __param(1, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "unsavePost", null);
__decorate([
    (0, common_1.Get)('saved'),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User, Number, Number]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "getSavedPosts", null);
__decorate([
    (0, common_1.Get)(':postId/share'),
    __param(0, (0, common_1.Param)('postId')),
    __param(1, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "getPostForShare", null);
__decorate([
    (0, common_1.Get)(':postId'),
    __param(0, (0, common_1.Param)('postId')),
    __param(1, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "getPost", null);
__decorate([
    (0, common_1.Post)(':postId/hide'),
    __param(0, (0, common_1.Param)('postId')),
    __param(1, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "hidePost", null);
__decorate([
    (0, common_1.Post)(':postId/unhide'),
    __param(0, (0, common_1.Param)('postId')),
    __param(1, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "unhidePost", null);
__decorate([
    (0, common_1.Put)(':postId/visibility'),
    __param(0, (0, common_1.Param)('postId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_visibility_dto_1.UpdateVisibilityDto,
        user_entity_1.User]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "updateVisibility", null);
__decorate([
    (0, common_1.Delete)(':postId'),
    __param(0, (0, common_1.Param)('postId')),
    __param(1, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "deletePost", null);
exports.PostsController = PostsController = __decorate([
    (0, common_1.Controller)('posts'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [posts_service_1.PostsService])
], PostsController);
//# sourceMappingURL=posts.controller.js.map