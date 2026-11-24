import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';

const SEMVER_REGEX = /^\d+\.\d+\.\d+$/;

export class CreateAppVersionDto {
  @Matches(SEMVER_REGEX, { message: 'Sürüm numarası X.Y.Z formatında olmalıdır (örn: 1.0.4).' })
  version: string;

  @IsOptional()
  @IsEnum(['all', 'android', 'ios'])
  platform?: 'all' | 'android' | 'ios';

  @IsString()
  @IsNotEmpty({ message: 'Güncelleme başlığı zorunludur.' })
  @MaxLength(150)
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'Sürüm notları zorunludur.' })
  @MaxLength(3000)
  releaseNotes: string;

  @IsOptional()
  @IsBoolean()
  forceUpdate?: boolean;

  @IsOptional()
  @Matches(SEMVER_REGEX, { message: 'Minimum desteklenen sürüm X.Y.Z formatında olmalıdır.' })
  minSupportedVersion?: string | null;

  @IsOptional()
  @IsUrl({}, { message: 'Geçerli bir Android mağaza URL adresi girin.' })
  androidStoreUrl?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Geçerli bir iOS mağaza URL adresi girin.' })
  iosStoreUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateAppVersionDto {
  @IsOptional()
  @Matches(SEMVER_REGEX, { message: 'Sürüm numarası X.Y.Z formatında olmalıdır.' })
  version?: string;

  @IsOptional()
  @IsEnum(['all', 'android', 'ios'])
  platform?: 'all' | 'android' | 'ios';

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(3000)
  releaseNotes?: string;

  @IsOptional()
  @IsBoolean()
  forceUpdate?: boolean;

  @IsOptional()
  @Matches(SEMVER_REGEX, { message: 'Minimum desteklenen sürüm X.Y.Z formatında olmalıdır.' })
  minSupportedVersion?: string | null;

  @IsOptional()
  @IsUrl({}, { message: 'Geçerli bir Android mağaza URL adresi girin.' })
  androidStoreUrl?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Geçerli bir iOS mağaza URL adresi girin.' })
  iosStoreUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

