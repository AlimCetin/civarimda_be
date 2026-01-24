import { ReportType, ReportReason } from '../../entities/report.entity';
export declare class CreateReportDto {
    reportedId: string;
    type: ReportType;
    reason: ReportReason;
    description?: string;
}
