import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { ScheduleType, StaffType } from '../../../../generated/prisma/enums';

export class CreateWorkScheduleDto {
  @IsUUID()
  staffUserId: string;

  @IsEnum(StaffType)
  staffType: StaffType;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek: number;

  @IsDateString()
  startsAt: string;

  @IsDateString()
  endsAt: string;

  @IsDateString()
  effectiveFrom: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @IsOptional()
  @IsEnum(ScheduleType)
  scheduleType?: ScheduleType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(240)
  slotDurationMinutes?: number;
}
