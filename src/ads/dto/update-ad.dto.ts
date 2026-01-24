import { IsString, IsEnum, IsOptional, IsUrl, IsDateString, IsNumber, Min, MaxLength } from 'class-validator';
import { AdStatus } from '../../entities/ad.entity';

export class UpdateAdDto {
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Title must be at most 200 characters' })
  title?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Media URL must be a valid URL' })
  mediaUrl?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Link URL must be a valid URL' })
  linkUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Description must be at most 500 characters' })
  description?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(AdStatus)
  status?: AdStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxImpressions?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budget?: number;
}

