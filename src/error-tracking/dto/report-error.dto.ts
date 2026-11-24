import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Mobil ve Admin istemcilerinden gelen hata/çökme bildirimleri için DTO.
 * 'backend' kaynağı yalnızca sunucu içi istisna filtresi tarafından yazılır.
 */
export class ReportClientErrorDto {
  @IsEnum(['mobile', 'admin'], { message: 'Geçersiz hata kaynağı.' })
  source: 'mobile' | 'admin';

  @IsOptional()
  @IsEnum(['warning', 'error', 'fatal'])
  severity?: 'warning' | 'error' | 'fatal';

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  message: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  stack?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  path?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  deviceInfo?: string;
}

