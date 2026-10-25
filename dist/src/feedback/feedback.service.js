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
exports.FeedbackService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const feedback_entity_1 = require("../entities/feedback.entity");
let FeedbackService = class FeedbackService {
    feedbackRepo;
    constructor(feedbackRepo) {
        this.feedbackRepo = feedbackRepo;
    }
    async create(data) {
        const feedback = this.feedbackRepo.create({
            userId: data.userId || null,
            userName: data.userName || 'Anonim Kullanıcı',
            userEmail: data.userEmail || '',
            rating: data.rating !== undefined ? Math.min(5, Math.max(1, Number(data.rating))) : 5,
            type: data.type || 'suggestion',
            title: data.title || '',
            message: data.message,
            deviceInfo: data.deviceInfo || '',
            status: 'pending',
        });
        return this.feedbackRepo.save(feedback);
    }
    async findAll(status, type) {
        const qb = this.feedbackRepo.createQueryBuilder('f').orderBy('f.createdAt', 'DESC');
        if (status) {
            qb.andWhere('f.status = :status', { status });
        }
        if (type) {
            qb.andWhere('f.type = :type', { type });
        }
        return qb.getMany();
    }
    async updateStatus(id, status, adminNote) {
        const feedback = await this.feedbackRepo.findOne({ where: { id } });
        if (!feedback) {
            throw new common_1.NotFoundException('Geri bildirim kaydı bulunamadı.');
        }
        feedback.status = status;
        if (adminNote !== undefined) {
            feedback.adminNote = adminNote;
        }
        return this.feedbackRepo.save(feedback);
    }
    async getStats() {
        const totalCount = await this.feedbackRepo.count();
        const pendingCount = await this.feedbackRepo.count({ where: { status: 'pending' } });
        const suggestionCount = await this.feedbackRepo.count({ where: { type: 'suggestion' } });
        const bugCount = await this.feedbackRepo.count({ where: { type: 'bug' } });
        const ratingCount = await this.feedbackRepo.count({ where: { type: 'rating' } });
        const avgRaw = await this.feedbackRepo
            .createQueryBuilder('f')
            .select('AVG(f.rating)', 'avg')
            .getRawOne();
        const avgRating = avgRaw?.avg ? Math.round(Number(avgRaw.avg) * 10) / 10 : 5.0;
        return {
            totalCount,
            avgRating,
            suggestionCount,
            bugCount,
            ratingCount,
            pendingCount,
        };
    }
};
exports.FeedbackService = FeedbackService;
exports.FeedbackService = FeedbackService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(feedback_entity_1.Feedback)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], FeedbackService);
//# sourceMappingURL=feedback.service.js.map