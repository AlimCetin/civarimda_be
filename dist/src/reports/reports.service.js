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
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const report_entity_1 = require("../entities/report.entity");
let ReportsService = class ReportsService {
    reportModel;
    postModel;
    userModel;
    commentModel;
    messageModel;
    constructor(reportModel, postModel, userModel, commentModel, messageModel) {
        this.reportModel = reportModel;
        this.postModel = postModel;
        this.userModel = userModel;
        this.commentModel = commentModel;
        this.messageModel = messageModel;
    }
    async create(userId, createReportDto) {
        if (createReportDto.type === report_entity_1.ReportType.USER && createReportDto.reportedId === userId) {
            throw new common_1.BadRequestException('You cannot report yourself');
        }
        await this.validateReportedItem(createReportDto.type, createReportDto.reportedId);
        const existingReport = await this.reportModel.findOne({
            reporterId: userId,
            reportedId: createReportDto.reportedId,
            type: createReportDto.type,
            status: { $in: [report_entity_1.ReportStatus.PENDING, report_entity_1.ReportStatus.IN_REVIEW] },
        });
        if (existingReport) {
            throw new common_1.BadRequestException('You have already reported this item');
        }
        const otherReports = await this.reportModel.countDocuments({
            reportedId: createReportDto.reportedId,
            type: createReportDto.type,
        });
        let priority = report_entity_1.ReportPriority.MEDIUM;
        if (otherReports >= 10)
            priority = report_entity_1.ReportPriority.URGENT;
        else if (otherReports >= 5)
            priority = report_entity_1.ReportPriority.HIGH;
        else if (otherReports === 0)
            priority = report_entity_1.ReportPriority.LOW;
        const report = await this.reportModel.create({
            ...createReportDto,
            reporterId: userId,
            priority,
            reportCount: otherReports + 1,
        });
        return report;
    }
    async findAll(status, type, priority, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const maxLimit = Math.min(limit, 100);
        const filter = {};
        if (status)
            filter.status = status;
        if (type)
            filter.type = type;
        if (priority)
            filter.priority = priority;
        const reports = await this.reportModel
            .find(filter)
            .populate('reporterId', 'fullName avatar')
            .populate('reviewedBy', 'fullName avatar')
            .sort({ priority: -1, createdAt: -1 })
            .skip(skip)
            .limit(maxLimit)
            .lean();
        const total = await this.reportModel.countDocuments(filter);
        return {
            reports: reports.map((report) => {
                const reporterIdPopulated = report.reporterId && typeof report.reporterId === 'object'
                    ? (report.reporterId._id || report.reporterId)?.toString()
                    : report.reporterId?.toString();
                const reviewedByPopulated = report.reviewedBy && typeof report.reviewedBy === 'object'
                    ? (report.reviewedBy._id || report.reviewedBy)?.toString()
                    : report.reviewedBy?.toString() || null;
                return {
                    id: report._id.toString(),
                    reporterId: reporterIdPopulated,
                    reportedId: report.reportedId,
                    type: report.type,
                    reason: report.reason,
                    description: report.description || '',
                    status: report.status,
                    priority: report.priority,
                    reviewedBy: reviewedByPopulated,
                    reviewedAt: report.reviewedAt || null,
                    adminNote: report.adminNote || '',
                    reportCount: report.reportCount || 1,
                    reporter: report.reporterId && typeof report.reporterId === 'object' ? {
                        id: (report.reporterId._id || report.reporterId).toString(),
                        fullName: report.reporterId.fullName || '',
                        avatar: report.reporterId.avatar || null,
                    } : null,
                    createdAt: report.createdAt || new Date(),
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
        if (!mongoose_2.Types.ObjectId.isValid(reportId)) {
            throw new common_1.BadRequestException('Invalid report ID format');
        }
        const report = await this.reportModel
            .findById(reportId)
            .populate('reporterId', 'fullName avatar')
            .populate('reviewedBy', 'fullName avatar')
            .lean();
        if (!report) {
            throw new common_1.NotFoundException('Report not found');
        }
        let reportedItem = null;
        try {
            if (report.type === report_entity_1.ReportType.POST) {
                const post = await this.postModel.findById(report.reportedId).lean();
                if (post) {
                    reportedItem = {
                        id: post._id.toString(),
                        userId: (post.userId && typeof post.userId === 'object' ? (post.userId._id || post.userId) : post.userId)?.toString(),
                        image: post.image,
                        video: post.video,
                        caption: post.caption,
                    };
                }
            }
            else if (report.type === report_entity_1.ReportType.USER) {
                const user = await this.userModel.findById(report.reportedId).select('-password').lean();
                if (user) {
                    reportedItem = {
                        id: user._id.toString(),
                        fullName: user.fullName,
                        avatar: user.avatar,
                        bio: user.bio,
                    };
                }
            }
            else if (report.type === report_entity_1.ReportType.COMMENT) {
                const comment = await this.commentModel.findById(report.reportedId).lean();
                if (comment) {
                    reportedItem = {
                        id: comment._id.toString(),
                        text: comment.text,
                        postId: (comment.postId && typeof comment.postId === 'object' ? (comment.postId._id || comment.postId) : comment.postId)?.toString(),
                        userId: (comment.userId && typeof comment.userId === 'object' ? (comment.userId._id || comment.userId) : comment.userId)?.toString(),
                    };
                }
            }
            else if (report.type === report_entity_1.ReportType.MESSAGE) {
                const message = await this.messageModel.findById(report.reportedId).lean();
                if (message) {
                    reportedItem = {
                        id: message._id.toString(),
                        text: message.text,
                        content: message.text,
                        senderId: (message.senderId && typeof message.senderId === 'object' ? (message.senderId._id || message.senderId) : message.senderId)?.toString(),
                        conversationId: (message.conversationId && typeof message.conversationId === 'object' ? (message.conversationId._id || message.conversationId) : message.conversationId)?.toString(),
                    };
                }
            }
        }
        catch (error) {
        }
        const reporterIdPopulated = report.reporterId && typeof report.reporterId === 'object'
            ? (report.reporterId._id || report.reporterId)?.toString()
            : report.reporterId?.toString();
        const reviewedByPopulated = report.reviewedBy && typeof report.reviewedBy === 'object'
            ? (report.reviewedBy._id || report.reviewedBy)?.toString()
            : report.reviewedBy?.toString() || null;
        return {
            id: report._id.toString(),
            reporterId: reporterIdPopulated,
            reportedId: report.reportedId,
            type: report.type,
            reason: report.reason,
            description: report.description || '',
            status: report.status,
            priority: report.priority,
            reviewedBy: reviewedByPopulated,
            reviewedAt: report.reviewedAt || null,
            adminNote: report.adminNote || '',
            reportCount: report.reportCount || 1,
            reporter: report.reporterId && typeof report.reporterId === 'object' ? {
                id: (report.reporterId._id || report.reporterId).toString(),
                fullName: report.reporterId.fullName || '',
                avatar: report.reporterId.avatar || null,
            } : null,
            reportedItem,
            createdAt: report.createdAt || new Date(),
        };
    }
    async update(reportId, updateReportDto, adminId) {
        if (!mongoose_2.Types.ObjectId.isValid(reportId)) {
            throw new common_1.BadRequestException('Invalid report ID format');
        }
        const report = await this.reportModel.findById(reportId);
        if (!report) {
            throw new common_1.NotFoundException('Report not found');
        }
        const updateData = {
            ...updateReportDto,
            reviewedBy: adminId,
            reviewedAt: new Date(),
        };
        Object.assign(report, updateData);
        await report.save();
        return report;
    }
    async getStatistics() {
        const total = await this.reportModel.countDocuments();
        const pending = await this.reportModel.countDocuments({ status: report_entity_1.ReportStatus.PENDING });
        const inReview = await this.reportModel.countDocuments({ status: report_entity_1.ReportStatus.IN_REVIEW });
        const resolved = await this.reportModel.countDocuments({ status: report_entity_1.ReportStatus.RESOLVED });
        const rejected = await this.reportModel.countDocuments({ status: report_entity_1.ReportStatus.REJECTED });
        const byType = await this.reportModel.aggregate([
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                },
            },
        ]);
        const byPriority = await this.reportModel.aggregate([
            {
                $group: {
                    _id: '$priority',
                    count: { $sum: 1 },
                },
            },
        ]);
        const urgentPending = await this.reportModel.countDocuments({
            status: report_entity_1.ReportStatus.PENDING,
            priority: report_entity_1.ReportPriority.URGENT,
        });
        return {
            total,
            pending,
            inReview,
            resolved,
            rejected,
            byType: byType.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
            byPriority: byPriority.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
            urgentPending,
        };
    }
    async validateReportedItem(type, reportedId) {
        if (!mongoose_2.Types.ObjectId.isValid(reportedId)) {
            throw new common_1.BadRequestException('Invalid reported item ID format');
        }
        if (type === report_entity_1.ReportType.POST) {
            const post = await this.postModel.findById(reportedId);
            if (!post) {
                throw new common_1.NotFoundException('Post not found');
            }
        }
        else if (type === report_entity_1.ReportType.USER) {
            const user = await this.userModel.findById(reportedId);
            if (!user) {
                throw new common_1.NotFoundException('User not found');
            }
        }
        else if (type === report_entity_1.ReportType.COMMENT) {
            const comment = await this.commentModel.findById(reportedId);
            if (!comment) {
                throw new common_1.NotFoundException('Comment not found');
            }
        }
        else if (type === report_entity_1.ReportType.MESSAGE) {
            const message = await this.messageModel.findById(reportedId);
            if (!message) {
                throw new common_1.NotFoundException('Message not found');
            }
        }
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(report_entity_1.Report.name)),
    __param(1, (0, mongoose_1.InjectModel)('Post')),
    __param(2, (0, mongoose_1.InjectModel)('User')),
    __param(3, (0, mongoose_1.InjectModel)('Comment')),
    __param(4, (0, mongoose_1.InjectModel)('Message')),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], ReportsService);
//# sourceMappingURL=reports.service.js.map