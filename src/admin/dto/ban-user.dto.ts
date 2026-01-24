import { IsOptional, IsBoolean, IsDateString, IsString } from 'class-validator';

export class BanUserDto {
  @IsOptional()
  @IsBoolean()
  isPermanent?: boolean;

  @IsOptional()
  @IsDateString()
  bannedUntil?: Date; // Geçici ban için bitiş tarihi

  @IsOptional()
  @IsString()
  reason?: string;
}

