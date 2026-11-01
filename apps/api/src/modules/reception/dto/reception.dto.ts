import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ReceptionAppointmentStatus {
  WAITING_CHECKIN = 'WAITING_CHECKIN',
  LATE = 'LATE',
  CHECKED_IN = 'CHECKED_IN',
}

export class ReceptionAppointmentsQueryDto {
  @ApiPropertyOptional({ example: '2026-10-31' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ enum: ReceptionAppointmentStatus })
  @IsOptional()
  @IsEnum(ReceptionAppointmentStatus)
  tab?: ReceptionAppointmentStatus;

  @ApiPropertyOptional({ enum: ReceptionAppointmentStatus })
  @IsOptional()
  @IsEnum(ReceptionAppointmentStatus)
  status?: ReceptionAppointmentStatus;

  @ApiPropertyOptional({ example: 'Nguyen Van A' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ example: 'Nguyen Van A' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  specialtyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;

  @ApiPropertyOptional({ default: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 5;
}

export class ReceptionQueueQueryDto {
  @ApiProperty()
  @IsUUID()
  specialtyId: string;

  @ApiPropertyOptional({ example: '2026-10-31' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 100;
}

export class PatientSearchQueryDto {
  @ApiProperty({ example: '0912345678' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  q: string;
}

export class WalkInDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @ApiPropertyOptional({ example: 'Nguyen Van A' })
  @ValidateIf((input: WalkInDto) => !input.patientId)
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[^\d]+$/)
  fullName?: string;

  @ApiPropertyOptional({ example: '0912345678' })
  @ValidateIf((input: WalkInDto) => !input.patientId)
  @IsString()
  @IsNotEmpty()
  @Matches(/^(0|\+84)(3|5|7|8|9)\d{8}$/)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.startsWith('+84')
      ? `0${value.slice(3)}`
      : value,
  )
  phone?: string;

  @ApiPropertyOptional({ enum: ['MALE', 'FEMALE', 'OTHER'] })
  @ValidateIf((input: WalkInDto) => !input.patientId)
  @IsIn(['MALE', 'FEMALE', 'OTHER'])
  gender?: 'MALE' | 'FEMALE' | 'OTHER';

  @ApiPropertyOptional({ example: 1990 })
  @ValidateIf((input: WalkInDto) => !input.patientId)
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear())
  birthYear?: number;

  @ApiPropertyOptional({ maxLength: 12 })
  @IsOptional()
  @IsString()
  @Matches(/^\d{12}$/)
  nationalId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  address?: string;

  @ApiProperty()
  @IsUUID()
  specialtyId: string;

  @ApiProperty()
  @IsUUID()
  doctorId: string;

  @ApiProperty()
  @IsUUID()
  appointmentSlotId: string;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  checkIn = false;
}
