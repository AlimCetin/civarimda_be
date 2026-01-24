import { IsString, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { ReportType, ReportReason } from '../../entities/report.entity';

export class CreateReportDto {
  @IsString()
  reportedId: string;

  @IsEnum(ReportType)
  type: ReportType;

  @IsEnum(ReportReason)
  reason: ReportReason;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Description must be at most 500 characters' })
  description?: string;
}

