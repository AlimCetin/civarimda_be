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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const report_entity_1 = require("../entities/report.entity");
const post_entity_1 = require("../entities/post.entity");
const user_entity_1 = require("../entities/user.entity");
const comment_entity_1 = require("../entities/comment.entity");
const message_entity_1 = require("../entities/message.entity");
const id_util_1 = require("../common/utils/id.util");
let ReportsService = class ReportsService {
    reportRepository;
    postRepository;
    userRepository;
    commentRepository;
    messageRepository;
    constructor(reportRepository, postRepository, userRepository, commentRepository, messageRepository) {
        this.reportRepository = reportRepository;
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.commentRepository = commentRepository;
        this.messageRepository = messageRepository;
    }
    async create(userId, createReportDto) {
        if (createReportDto.type === report_entity_1.ReportType.USER && createReportDto.reportedId === userId) {
            throw new common_1.BadRequestException('You cannot report yourself');
        }
        await this.validateReportedItem(createReportDto.type, createReportDto.reportedId);
        const existingReport = await this.reportRepository.findOne({
            where: {
                reporterId: userId,
                reportedId: createReportDto.reportedId,
                type: createReportDto.type,
                status: (0, typeorm_2.In)([report_entity_1.ReportStatus.PENDING, report_entity_1.ReportStatus.IN_REVIEW]),
            },
        });
        if (existingReport) {
            throw new common_1.BadRequestException('You have already reported this item');
        }
        const otherReports = await this.reportRepository.count({
            where: {
                reportedId: createReportDto.reportedId,
                type: createReportDto.type,
            },
        });
        let priority = report_entity_1.ReportPriority.MEDIUM;
        if (otherReports >= 10)
            priority = report_entity_1.ReportPriority.URGENT;
        else if (otherReports >= 5)
            priority = report_entity_1.ReportPriority.HIGH;
        else if (otherReports === 0)
            priority = report_entity_1.ReportPriority.LOW;
        const report = this.reportRepository.create({
            ...createReportDto,
            reporterId: userId,
            priority,
            reportCount: otherReports + 1,
            status: report_entity_1.ReportStatus.PENDING,
        });
        await this.reportRepository.save(report);
        return report;
    }
    async findAll(status, type, priority, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const maxLimit = Math.min(limit, 100);
        const query = this.reportRepository.createQueryBuilder('r');
        if (status)
            query.andWhere('r.status = :status', { status });
        if (type)
            query.andWhere('r.type = :type', { type });
        if (priority)
            query.andWhere('r.priority = :priority', { priority });
        const [reports, total] = await query
            .orderBy('r.priority', 'DESC')
            .addOrderBy('r.createdAt', 'DESC')
            .skip(skip)
            .take(maxLimit)
            .getManyAndCount();
        const userIds = Array.from(new Set([
            ...reports.map((r) => r.reporterId),
            ...reports.map((r) => r.reviewedBy).filter(Boolean),
        ]));
        let userMap = new Map();
        if (userIds.length > 0) {
            const users = await this.userRepository.find({
                where: { id: (0, typeorm_2.In)(userIds) },
                select: ['id', 'fullName', 'avatar'],
            });
            userMap = new Map(users.map((u) => [u.id, u]));
        }
        return {
            reports: reports.map((report) => {
                const reporter = userMap.get(report.reporterId);
                const reviewer = report.reviewedBy ? userMap.get(report.reviewedBy) : null;
                return {
                    id: report.id,
                    _id: report.id,
                    reporterId: report.reporterId,
                    reportedId: report.reportedId,
                    type: report.type,
                    reason: report.reason,
                    description: report.description || '',
                    status: report.status,
                    priority: report.priority,
                    reviewedBy: report.reviewedBy || null,
                    reviewedAt: report.reviewedAt || null,
                    adminNote: report.adminNote || '',
                    reportCount: report.reportCount || 1,
                    reporter: reporter
                        ? {
                            id: reporter.id,
                            _id: reporter.id,
                            fullName: reporter.fullName || '',
                            avatar: reporter.avatar || null,
                        }
                        : null,
                    createdAt: report.createdAt,
                };
            }),
            pagination: {
                page,
                limit: maxLimit,
                total,
                hasMore: skip + reports.length < total,
            },
        };
    }
    async findOne(reportId) {
        if (!(0, id_util_1.isValidId)(reportId)) {
            throw new common_1.BadRequestException('Invalid report ID format');
        }
        const report = await this.reportRepository.findOne({
            where: { id: reportId },
        });
        if (!report) {
            throw new common_1.NotFoundException('Report not found');
        }
        let reportedItem = null;
        try {
            if (report.type === report_entity_1.ReportType.POST) {
                const post = await this.postRepository.findOne({ where: { id: report.reportedId } });
                if (post) {
                    reportedItem = {
                        id: post.id,
                        userId: post.userId,
                        image: post.image,
                        video: post.video,
                        caption: post.caption,
                    };
                }
            }
            else if (report.type === report_entity_1.ReportType.USER) {
                const user = await this.userRepository.findOne({
                    where: { id: report.reportedId },
                    select: ['id', 'fullName', 'avatar', 'bio'],
                });
                if (user) {
                    reportedItem = {
                        id: user.id,
                        fullName: user.fullName,
                        avatar: user.avatar,
                        bio: user.bio,
                    };
                }
            }
            else if (report.type === report_entity_1.ReportType.COMMENT) {
                const comment = await this.commentRepository.findOne({ where: { id: report.reportedId } });
                if (comment) {
                    reportedItem = {
                        id: comment.id,
                        text: comment.text,
                        postId: comment.postId,
                        userId: comment.userId,
                    };
                }
            }
            else if (report.type === report_entity_1.ReportType.MESSAGE) {
                const message = await this.messageRepository.findOne({ where: { id: report.reportedId } });
                if (message) {
                    reportedItem = {
                        id: message.id,
                        text: message.text,
                        content: message.text,
                        senderId: message.senderId,
                        conversationId: message.conversationId,
                    };
                }
            }
        }
        catch (error) {
        }
        const reporter = await this.userRepository.findOne({
            where: { id: report.reporterId },
            select: ['id', 'fullName', 'avatar'],
        });
        return {
            id: report.id,
            _id: report.id,
            reporterId: report.reporterId,
            reportedId: report.reportedId,
            type: report.type,
            reason: report.reason,
            description: report.description || '',
            status: report.status,
            priority: report.priority,
            reviewedBy: report.reviewedBy || null,
            reviewedAt: report.reviewedAt || null,
            adminNote: report.adminNote || '',
            reportCount: report.reportCount || 1,
            reporter: reporter
                ? {
                    id: reporter.id,
                    _id: reporter.id,
                    fullName: reporter.fullName || '',
                    avatar: reporter.avatar || null,
                }
                : null,
            reportedItem,
            createdAt: report.createdAt,
        };
    }
    async update(reportId, updateReportDto, adminId) {
        if (!(0, id_util_1.isValidId)(reportId)) {
            throw new common_1.BadRequestException('Invalid report ID format');
        }
        const report = await this.reportRepository.findOne({
            where: { id: reportId },
        });
        if (!report) {
            throw new common_1.NotFoundException('Report not found');
        }
        Object.assign(report, {
            ...updateReportDto,
            reviewedBy: adminId,
            reviewedAt: new Date(),
        });
        await this.reportRepository.save(report);
        return report;
    }
    async getStatistics() {
        const total = await this.reportRepository.count();
        const pending = await this.reportRepository.count({ where: { status: report_entity_1.ReportStatus.PENDING } });
        const inReview = await this.reportRepository.count({ where: { status: report_entity_1.ReportStatus.IN_REVIEW } });
        const resolved = await this.reportRepository.count({ where: { status: report_entity_1.ReportStatus.RESOLVED } });
        const rejected = await this.reportRepository.count({ where: { status: report_entity_1.ReportStatus.REJECTED } });
        const byType = await this.reportRepository
            .createQueryBuilder('r')
            .select('r.type', 'type')
            .addSelect('COUNT(*)', 'count')
            .groupBy('r.type')
            .getRawMany();
        const byPriority = await this.reportRepository
            .createQueryBuilder('r')
            .select('r.priority', 'priority')
            .addSelect('COUNT(*)', 'count')
            .groupBy('r.priority')
            .getRawMany();
        const urgentPending = await this.reportRepository.count({
            where: { status: report_entity_1.ReportStatus.PENDING, priority: report_entity_1.ReportPriority.URGENT },
        });
        return {
            total,
            pending,
            inReview,
            resolved,
            rejected,
            byType: byType.reduce((acc, item) => ({ ...acc, [item.type]: parseInt(item.count) }), {}),
            byPriority: byPriority.reduce((acc, item) => ({ ...acc, [item.priority]: parseInt(item.count) }), {}),
            urgentPending,
        };
    }
    async validateReportedItem(type, reportedId) {
        if (!(0, id_util_1.isValidId)(reportedId)) {
            throw new common_1.BadRequestException('Invalid reported item ID format');
        }
        if (type === report_entity_1.ReportType.POST) {
            const post = await this.postRepository.findOne({ where: { id: reportedId } });
            if (!post)
                throw new common_1.NotFoundException('Post not found');
        }
        else if (type === report_entity_1.ReportType.USER) {
            const user = await this.userRepository.findOne({ where: { id: reportedId } });
            if (!user)
                throw new common_1.NotFoundException('User not found');
        }
        else if (type === report_entity_1.ReportType.COMMENT) {
            const comment = await this.commentRepository.findOne({ where: { id: reportedId } });
            if (!comment)
                throw new common_1.NotFoundException('Comment not found');
        }
        else if (type === report_entity_1.ReportType.MESSAGE) {
            const message = await this.messageRepository.findOne({ where: { id: reportedId } });
            if (!message)
                throw new common_1.NotFoundException('Message not found');
        }
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(report_entity_1.Report)),
    __param(1, (0, typeorm_1.InjectRepository)(post_entity_1.Post)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(3, (0, typeorm_1.InjectRepository)(comment_entity_1.Comment)),
    __param(4, (0, typeorm_1.InjectRepository)(message_entity_1.Message)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ReportsService);
//# sourceMappingURL=reports.service.js.map