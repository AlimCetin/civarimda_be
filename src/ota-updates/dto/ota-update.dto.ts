import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOtaReleaseDto {
  @IsEnum(['android', 'ios'], { message: 'Platform android veya ios olmalıdır.' })
  platform: 'android' | 'ios';

  @IsOptional()
  @IsEnum(['production', 'staging'])
  channel?: 'production' | 'staging';

  @Matches(/^\d+\.\d+\.\d+$/, {
    message: 'Hedef uygulama sürümü X.Y.Z formatında olmalıdır (örn: 1.0.3).',
  })
  targetAppVersion: string;

  @IsString()
  @IsNotEmpty({ message: 'Sürüm notları zorunludur.' })
  @MaxLength(2000)
  releaseNotes: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  shouldForceUpdate?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  rolloutPercentage?: number;
}

export class UpdateOtaReleaseDto {
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  shouldForceUpdate?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  rolloutPercentage?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  releaseNotes?: string;
}

