import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { StaffType } from '../../../../generated/prisma/enums';

export class CreateWorkScheduleDto {
  @IsUUID()
  staffUserId: string;

  @IsEnum(StaffType)
  staffType: StaffType;

  @IsDateString()
  effectiveFrom: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

}
