import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Report, ReportStatus, ReportPriority, ReportType } from '../entities/report.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Report.name) private reportModel: Model<Report>,
    @InjectModel('Post') private postModel: Model<any>,
    @InjectModel('User') private userModel: Model<any>,
    @InjectModel('Comment') private commentModel: Model<any>,
    @InjectModel('Message') private messageModel: Model<any>,
  ) {}

  async create(userId: string, createReportDto: CreateReportDto) {
    // Check if user is reporting themselves
    if (createReportDto.type === ReportType.USER && createReportDto.reportedId === userId) {
      throw new BadRequestException('You cannot report yourself');
    }

    // Check if the reported item exists
    await this.validateReportedItem(createReportDto.type, createReportDto.reportedId);

    // Check if user already reported this item
    const existingReport = await this.reportModel.findOne({
      reporterId: userId,
      reportedId: createReportDto.reportedId,
      type: createReportDto.type,
      status: { $in: [ReportStatus.PENDING, ReportStatus.IN_REVIEW] },
    });

    if (existingReport) {
      throw new BadRequestException('You have already reported this item');
    }

    // Check if there are other reports for the same item
    const otherReports = await this.reportModel.countDocuments({
      reportedId: createReportDto.reportedId,
      type: createReportDto.type,
    });

    // Determine priority based on report count
    let priority = ReportPriority.MEDIUM;
    if (otherReports >= 10) priority = ReportPriority.URGENT;
    else if (otherReports >= 5) priority = ReportPriority.HIGH;
    else if (otherReports === 0) priority = ReportPriority.LOW;

    const report = await this.reportModel.create({
      ...createReportDto,
      reporterId: userId,
      priority,
      reportCount: otherReports + 1,
    });

    return report;
  }

  async findAll(
    status?: ReportStatus,
    type?: ReportType,
    priority?: ReportPriority,
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;
    const maxLimit = Math.min(limit, 100);

    const filter: any = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (priority) filter.priority = priority;

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
      reports: reports.map((report: any) => {
        const reporterIdPopulated = report.reporterId && typeof report.reporterId === 'object'
          ? ((report.reporterId as any)._id || report.reporterId)?.toString()
          : report.reporterId?.toString();
        
        const reviewedByPopulated = report.reviewedBy && typeof report.reviewedBy === 'object'
          ? ((report.reviewedBy as any)._id || report.reviewedBy)?.toString()
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
            id: ((report.reporterId as any)._id || report.reporterId).toString(),
            fullName: (report.reporterId as any).fullName || '',
            avatar: (report.reporterId as any).avatar || null,
          } : null,
          createdAt: (report as any).createdAt || new Date(),
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

  async findOne(reportId: string) {
    if (!Types.ObjectId.isValid(reportId)) {
      throw new BadRequestException('Invalid report ID format');
    }

    const report = await this.reportModel
      .findById(reportId)
      .populate('reporterId', 'fullName avatar')
      .populate('reviewedBy', 'fullName avatar')
      .lean();

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    // Get reported item details
    let reportedItem: any = null;
    try {
      if (report.type === ReportType.POST) {
        const post: any = await this.postModel.findById(report.reportedId).lean();
        if (post) {
          reportedItem = {
            id: post._id.toString(),
            userId: (post.userId && typeof post.userId === 'object' ? (post.userId._id || post.userId) : post.userId)?.toString(),
            image: post.image,
            video: post.video,
            caption: post.caption,
          };
        }
      } else if (report.type === ReportType.USER) {
        const user: any = await this.userModel.findById(report.reportedId).select('-password').lean();
        if (user) {
          reportedItem = {
            id: user._id.toString(),
            fullName: user.fullName,
            avatar: user.avatar,
            bio: user.bio,
          };
        }
      } else if (report.type === ReportType.COMMENT) {
        const comment: any = await this.commentModel.findById(report.reportedId).lean();
        if (comment) {
          reportedItem = {
            id: comment._id.toString(),
            text: comment.text,
            postId: (comment.postId && typeof comment.postId === 'object' ? (comment.postId._id || comment.postId) : comment.postId)?.toString(),
            userId: (comment.userId && typeof comment.userId === 'object' ? (comment.userId._id || comment.userId) : comment.userId)?.toString(),
          };
        }
      } else if (report.type === ReportType.MESSAGE) {
        const message: any = await this.messageModel.findById(report.reportedId).lean();
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
    } catch (error) {
      // Item might be deleted
    }

    const reporterIdPopulated = report.reporterId && typeof report.reporterId === 'object' 
      ? ((report.reporterId as any)._id || report.reporterId)?.toString()
      : report.reporterId?.toString();
    
    const reviewedByPopulated = report.reviewedBy && typeof report.reviewedBy === 'object'
      ? ((report.reviewedBy as any)._id || report.reviewedBy)?.toString()
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
        id: ((report.reporterId as any)._id || report.reporterId).toString(),
        fullName: (report.reporterId as any).fullName || '',
        avatar: (report.reporterId as any).avatar || null,
      } : null,
      reportedItem,
      createdAt: (report as any).createdAt || new Date(),
    };
  }

  async update(reportId: string, updateReportDto: UpdateReportDto, adminId: string) {
    if (!Types.ObjectId.isValid(reportId)) {
      throw new BadRequestException('Invalid report ID format');
    }

    const report = await this.reportModel.findById(reportId);
    if (!report) {
      throw new NotFoundException('Report not found');
    }

    const updateData: any = {
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
    const pending = await this.reportModel.countDocuments({ status: ReportStatus.PENDING });
    const inReview = await this.reportModel.countDocuments({ status: ReportStatus.IN_REVIEW });
    const resolved = await this.reportModel.countDocuments({ status: ReportStatus.RESOLVED });
    const rejected = await this.reportModel.countDocuments({ status: ReportStatus.REJECTED });

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
      status: ReportStatus.PENDING,
      priority: ReportPriority.URGENT,
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

  private async validateReportedItem(type: ReportType, reportedId: string) {
    if (!Types.ObjectId.isValid(reportedId)) {
      throw new BadRequestException('Invalid reported item ID format');
    }

    if (type === ReportType.POST) {
      const post = await this.postModel.findById(reportedId);
      if (!post) {
        throw new NotFoundException('Post not found');
      }
    } else if (type === ReportType.USER) {
      const user = await this.userModel.findById(reportedId);
      if (!user) {
        throw new NotFoundException('User not found');
      }
    } else if (type === ReportType.COMMENT) {
      const comment = await this.commentModel.findById(reportedId);
      if (!comment) {
        throw new NotFoundException('Comment not found');
      }
    } else if (type === ReportType.MESSAGE) {
      const message = await this.messageModel.findById(reportedId);
      if (!message) {
        throw new NotFoundException('Message not found');
      }
    }
  }
}

