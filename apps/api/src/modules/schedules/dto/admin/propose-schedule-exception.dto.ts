import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ScheduleExceptionResolution } from '../../../../generated/prisma/enums';

export class ProposeScheduleExceptionDto {
  @IsEnum(ScheduleExceptionResolution)
  resolution: ScheduleExceptionResolution;

  @IsOptional()
  @IsUUID()
  toDoctorId?: string;

  @IsOptional()
  @IsUUID()
  toSlotId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  reason?: string;
}
