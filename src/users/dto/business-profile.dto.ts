import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Normal kullanıcıların tek adımda işletme profili oluşturma/güncelleme DTO'su.
 */
export class SetupBusinessProfileDto {
  @IsString()
  @IsNotEmpty({ message: 'İşletme adı zorunludur.' })
  @MaxLength(150)
  businessName: string;

  @IsString()
  @IsNotEmpty({ message: 'İşletme kategorisi zorunludur.' })
  @MaxLength(100)
  businessCategory: string;

  @IsString()
  @IsNotEmpty({ message: 'İşletme telefonu zorunludur.' })
  @MaxLength(30)
  businessPhone: string;

  @IsString()
  @IsNotEmpty({ message: 'İşletme şehri zorunludur.' })
  @MaxLength(100)
  businessCity: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  businessAddress?: string;
}

