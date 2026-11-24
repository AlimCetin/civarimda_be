import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AppointmentStatus } from '../../entities/appointment.entity';

const TIME_HHMM_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_YYYYMMDD_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export class CreateSalonServiceDto {
  @IsString()
  @IsNotEmpty({ message: 'Hizmet adı zorunludur.' })
  @MaxLength(150)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @Type(() => Number)
  @IsInt()
  @Min(10)
  @Max(480)
  durationMinutes: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateSalonServiceDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(10)
  @Max(480)
  durationMinutes?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class DayScheduleItemDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @IsBoolean()
  isOpen: boolean;

  @Matches(TIME_HHMM_REGEX, { message: 'Açılış saati HH:mm formatında olmalıdır.' })
  openTime: string;

  @Matches(TIME_HHMM_REGEX, { message: 'Kapanış saati HH:mm formatında olmalıdır.' })
  closeTime: string;

  @IsOptional()
  @Matches(TIME_HHMM_REGEX, { message: 'Mola başlangıcı HH:mm formatında olmalıdır.' })
  breakStart?: string | null;

  @IsOptional()
  @Matches(TIME_HHMM_REGEX, { message: 'Mola bitişi HH:mm formatında olmalıdır.' })
  breakEnd?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(10)
  @Max(120)
  slotIntervalMinutes?: number;
}

export class UpsertScheduleDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DayScheduleItemDto)
  days: DayScheduleItemDto[];
}

export class CreateAppointmentDto {
  @IsUUID('4', { message: 'Geçersiz işletme kimliği.' })
  businessUserId: string;

  @IsUUID('4', { message: 'Geçersiz hizmet kimliği.' })
  serviceId: string;

  @Matches(DATE_YYYYMMDD_REGEX, { message: 'Tarih YYYY-AA-GG formatında olmalıdır.' })
  appointmentDate: string;

  @Matches(TIME_HHMM_REGEX, { message: 'Saat HH:mm formatında olmalıdır.' })
  startTime: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  requestedTreatment?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  customerNote?: string;
}

export class UpdateAppointmentStatusDto {
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  businessNote?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  cancelReason?: string;
}

