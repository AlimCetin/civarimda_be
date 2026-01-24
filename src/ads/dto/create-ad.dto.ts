import { IsString, IsEnum, IsOptional, IsUrl, IsDateString, IsNumber, Min, MaxLength } from 'class-validator';
import { AdType, AdStatus } from '../../entities/ad.entity';

export class CreateAdDto {
  @IsString()
  @MaxLength(200, { message: 'Title must be at most 200 characters' })
  title: string;

  @IsEnum(AdType)
  type: AdType;

  @IsUrl({}, { message: 'Media URL must be a valid URL' })
  mediaUrl: string;

  @IsUrl({}, { message: 'Link URL must be a valid URL' })
  linkUrl: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Description must be at most 500 characters' })
  description?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxImpressions?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budget?: number;

  @IsOptional()
  @IsEnum(AdStatus)
  status?: AdStatus;
}

