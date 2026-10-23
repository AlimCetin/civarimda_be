import { User } from '../entities/user.entity';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ReportStatus, ReportType, ReportPriority } from '../entities/report.entity';
export declare class ReportsController {
    private reportsService;
    constructor(reportsService: ReportsService);
    create(createReportDto: CreateReportDto, user: User): Promise<import("../entities/report.entity").Report>;
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
    findOne(id: string): Promise<{
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
    update(id: string, updateReportDto: UpdateReportDto, admin: User): Promise<import("../entities/report.entity").Report>;
}
