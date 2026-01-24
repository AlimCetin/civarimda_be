import { Model, Types } from 'mongoose';
import { Report, ReportStatus, ReportPriority, ReportType } from '../entities/report.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
export declare class ReportsService {
    private reportModel;
    private postModel;
    private userModel;
    private commentModel;
    private messageModel;
    constructor(reportModel: Model<Report>, postModel: Model<any>, userModel: Model<any>, commentModel: Model<any>, messageModel: Model<any>);
    create(userId: string, createReportDto: CreateReportDto): Promise<import("mongoose").Document<unknown, {}, Report, {}, import("mongoose").DefaultSchemaOptions> & Report & Required<{
        _id: Types.ObjectId;
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
    findOne(reportId: string): Promise<{
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
    update(reportId: string, updateReportDto: UpdateReportDto, adminId: string): Promise<import("mongoose").Document<unknown, {}, Report, {}, import("mongoose").DefaultSchemaOptions> & Report & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
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
    private validateReportedItem;
}
