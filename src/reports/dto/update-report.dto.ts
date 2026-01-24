import { IsEnum, IsString, IsOptional, MaxLength } from 'class-validator';
import { ReportStatus, ReportPriority } from '../../entities/report.entity';

export class UpdateReportDto {
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @IsOptional()
  @IsEnum(ReportPriority)
  priority?: ReportPriority;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Admin note must be at most 1000 characters' })
  adminNote?: string;
}

