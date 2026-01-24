import { ReportStatus, ReportPriority } from '../../entities/report.entity';
export declare class UpdateReportDto {
    status?: ReportStatus;
    priority?: ReportPriority;
    adminNote?: string;
}
