import { Repository } from 'typeorm';
import { Report, ReportStatus, ReportPriority, ReportType } from '../entities/report.entity';
import { Post } from '../entities/post.entity';
import { User } from '../entities/user.entity';
import { Comment } from '../entities/comment.entity';
import { Message } from '../entities/message.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
export declare class ReportsService {
    private reportRepository;
    private postRepository;
    private userRepository;
    private commentRepository;
    private messageRepository;
    constructor(reportRepository: Repository<Report>, postRepository: Repository<Post>, userRepository: Repository<User>, commentRepository: Repository<Comment>, messageRepository: Repository<Message>);
    create(userId: string, createReportDto: CreateReportDto): Promise<Report>;
    findAll(status?: ReportStatus, type?: ReportType, priority?: ReportPriority, page?: number, limit?: number): Promise<{
        reports: {
            id: string;
            _id: string;
            reporterId: string;
            reportedId: string;
            type: ReportType;
            reason: import("../entities/report.entity").ReportReason;
            description: string;
            status: ReportStatus;
            priority: ReportPriority;
            reviewedBy: string | null;
            reviewedAt: Date | null;
            adminNote: string;
            reportCount: number;
            reporter: {
                id: string;
                _id: string;
                fullName: string;
                avatar: string | null;
            } | null;
            createdAt: Date;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            hasMore: boolean;
        };
    }>;
    findOne(reportId: string): Promise<{
        id: string;
        _id: string;
        reporterId: string;
        reportedId: string;
        type: ReportType;
        reason: import("../entities/report.entity").ReportReason;
        description: string;
        status: ReportStatus;
        priority: ReportPriority;
        reviewedBy: string | null;
        reviewedAt: Date | null;
        adminNote: string;
        reportCount: number;
        reporter: {
            id: string;
            _id: string;
            fullName: string;
            avatar: string | null;
        } | null;
        reportedItem: any;
        createdAt: Date;
    }>;
    update(reportId: string, updateReportDto: UpdateReportDto, adminId: string): Promise<Report>;
    getStatistics(): Promise<{
        total: number;
        pending: number;
        inReview: number;
        resolved: number;
        rejected: number;
        byType: any;
        byPriority: any;
        urgentPending: number;
    }>;
    private validateReportedItem;
}
