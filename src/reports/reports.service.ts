import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import { Report, ReportStatus, ReportPriority, ReportType } from '../entities/report.entity';
import { Post } from '../entities/post.entity';
import { User } from '../entities/user.entity';
import { Comment } from '../entities/comment.entity';
import { Message } from '../entities/message.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { isValidId } from '../common/utils/id.util';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report) private reportRepository: Repository<Report>,
    @InjectRepository(Post) private postRepository: Repository<Post>,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Comment) private commentRepository: Repository<Comment>,
    @InjectRepository(Message) private messageRepository: Repository<Message>,
  ) {}

  async create(userId: string, createReportDto: CreateReportDto) {
    if (createReportDto.type === ReportType.USER && createReportDto.reportedId === userId) {
      throw new BadRequestException('You cannot report yourself');
    }

    await this.validateReportedItem(createReportDto.type, createReportDto.reportedId);

    const existingReport = await this.reportRepository.findOne({
      where: {
        reporterId: userId,
        reportedId: createReportDto.reportedId,
        type: createReportDto.type,
        status: In([ReportStatus.PENDING, ReportStatus.IN_REVIEW]),
      },
    });

    if (existingReport) {
      throw new BadRequestException('You have already reported this item');
    }

    const otherReports = await this.reportRepository.count({
      where: {
        reportedId: createReportDto.reportedId,
        type: createReportDto.type,
      },
    });

    let priority = ReportPriority.MEDIUM;
    if (otherReports >= 10) priority = ReportPriority.URGENT;
    else if (otherReports >= 5) priority = ReportPriority.HIGH;
    else if (otherReports === 0) priority = ReportPriority.LOW;

    const report = this.reportRepository.create({
      ...createReportDto,
      reporterId: userId,
      priority,
      reportCount: otherReports + 1,
      status: ReportStatus.PENDING,
    });

    await this.reportRepository.save(report);
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

    const query = this.reportRepository.createQueryBuilder('r');

    if (status) query.andWhere('r.status = :status', { status });
    if (type) query.andWhere('r.type = :type', { type });
    if (priority) query.andWhere('r.priority = :priority', { priority });

    const [reports, total] = await query
      .orderBy('r.priority', 'DESC')
      .addOrderBy('r.createdAt', 'DESC')
      .skip(skip)
      .take(maxLimit)
      .getManyAndCount();

    const userIds = Array.from(
      new Set(
        [
          ...reports.map((r) => r.reporterId),
          ...reports.map((r) => r.reviewedBy).filter(Boolean),
        ] as string[],
      ),
    );

    let userMap = new Map<string, User>();
    if (userIds.length > 0) {
      const users = await this.userRepository.find({
        where: { id: In(userIds) },
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

  async findOne(reportId: string) {
    if (!isValidId(reportId)) {
      throw new BadRequestException('Invalid report ID format');
    }

    const report = await this.reportRepository.findOne({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    let reportedItem: any = null;
    try {
      if (report.type === ReportType.POST) {
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
      } else if (report.type === ReportType.USER) {
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
      } else if (report.type === ReportType.COMMENT) {
        const comment = await this.commentRepository.findOne({ where: { id: report.reportedId } });
        if (comment) {
          reportedItem = {
            id: comment.id,
            text: comment.text,
            postId: comment.postId,
            userId: comment.userId,
          };
        }
      } else if (report.type === ReportType.MESSAGE) {
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
    } catch (error) {
      // Item might be deleted
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

  async update(reportId: string, updateReportDto: UpdateReportDto, adminId: string) {
    if (!isValidId(reportId)) {
      throw new BadRequestException('Invalid report ID format');
    }

    const report = await this.reportRepository.findOne({
      where: { id: reportId },
    });
    if (!report) {
      throw new NotFoundException('Report not found');
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
    const pending = await this.reportRepository.count({ where: { status: ReportStatus.PENDING } });
    const inReview = await this.reportRepository.count({ where: { status: ReportStatus.IN_REVIEW } });
    const resolved = await this.reportRepository.count({ where: { status: ReportStatus.RESOLVED } });
    const rejected = await this.reportRepository.count({ where: { status: ReportStatus.REJECTED } });

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
      where: { status: ReportStatus.PENDING, priority: ReportPriority.URGENT },
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

  private async validateReportedItem(type: ReportType, reportedId: string) {
    if (!isValidId(reportedId)) {
      throw new BadRequestException('Invalid reported item ID format');
    }

    if (type === ReportType.POST) {
      const post = await this.postRepository.findOne({ where: { id: reportedId } });
      if (!post) throw new NotFoundException('Post not found');
    } else if (type === ReportType.USER) {
      const user = await this.userRepository.findOne({ where: { id: reportedId } });
      if (!user) throw new NotFoundException('User not found');
    } else if (type === ReportType.COMMENT) {
      const comment = await this.commentRepository.findOne({ where: { id: reportedId } });
      if (!comment) throw new NotFoundException('Comment not found');
    } else if (type === ReportType.MESSAGE) {
      const message = await this.messageRepository.findOne({ where: { id: reportedId } });
      if (!message) throw new NotFoundException('Message not found');
    }
  }
}
