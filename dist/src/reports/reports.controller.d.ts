import { User } from '../entities/user.entity';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ReportStatus, ReportType, ReportPriority } from '../entities/report.entity';
export declare class ReportsController {
    private reportsService;
    constructor(reportsService: ReportsService);
    create(createReportDto: CreateReportDto, user: User): Promise<import("mongoose").Document<unknown, {}, import("../entities/report.entity").Report, {}, import("mongoose").DefaultSchemaOptions> & import("../entities/report.entity").Report & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    findAll(status?: ReportStatus, type?: ReportType, priority?: ReportPriority, page?: number, limit?: number): Promise<{
        reports: {
            id: any;
            reporterId: any;
            reportedId: any;
            type: any;
            reason: any;
            description: any;
            status: any;
            priority: any;
            reviewedBy: any;
            reviewedAt: any;
            adminNote: any;
            reportCount: any;
            reporter: {
                id: any;
                fullName: any;
                avatar: any;
            } | null;
            createdAt: any;
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
        reporterId: any;
        reportedId: string;
        type: ReportType;
        reason: import("../entities/report.entity").ReportReason;
        description: string;
        status: ReportStatus;
        priority: ReportPriority;
        reviewedBy: any;
        reviewedAt: Date;
        adminNote: string;
        reportCount: number;
        reporter: {
            id: any;
            fullName: any;
            avatar: any;
        } | null;
        reportedItem: any;
        createdAt: any;
    }>;
    update(id: string, updateReportDto: UpdateReportDto, admin: User): Promise<import("mongoose").Document<unknown, {}, import("../entities/report.entity").Report, {}, import("mongoose").DefaultSchemaOptions> & import("../entities/report.entity").Report & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
}
