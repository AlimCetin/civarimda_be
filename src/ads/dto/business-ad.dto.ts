import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AdScope, AdType } from '../../entities/ad.entity';

/**
 * İşletmelerin ücretsiz veya paketli reklam yayınlama isteği için DTO.
 * Süre ve görüntülenme kotası sunucu tarafından belirlenir (manipüle edilemez).
 */
export class CreateBusinessAdDto {
  @IsString()
  @IsNotEmpty({ message: 'Reklam başlığı zorunludur.' })
  @MaxLength(200)
  title: string;

  @IsEnum(AdType)
  type: AdType;

  @IsUrl({}, { message: 'Geçerli bir medya URL adresi girin.' })
  mediaUrl: string;

  @IsUrl({}, { message: 'Geçerli bir hedef bağlantı URL adresi girin.' })
  linkUrl: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsEnum(AdScope)
  scope?: AdScope;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string | null;
}

/**
 * Satın alınan reklam paketi kredisiyle reklam yayınlama DTO'su.
 */
export class CreatePaidBusinessAdDto extends CreateBusinessAdDto {
  @IsUUID('4', { message: 'Geçerli bir satın alma kimliği (purchaseId) zorunludur.' })
  purchaseId: string;
}

/**
 * Reklam paketi satın alma DTO'su.
 */
export class PurchaseAdPackageDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  paymentReference?: string;
}

