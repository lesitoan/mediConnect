import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { StaffType } from '../../../../generated/prisma/enums';

export class WorkScheduleQueryDto {
  @IsDateString()
  from: string;

  @IsDateString()
  to: string;

  @IsOptional()
  @IsEnum(StaffType)
  staffType?: StaffType;

  @IsOptional()
  @IsUUID()
  staffUserId?: string;
}
