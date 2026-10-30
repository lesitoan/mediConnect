import {
  IsDateString,
  IsEnum,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { LeaveRequestType } from '../../../../generated/prisma/enums';

export class CreateLeaveRequestDto {
  @IsEnum(LeaveRequestType)
  requestType: LeaveRequestType;

  @IsDateString()
  startsAt: string;

  @IsDateString()
  endsAt: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  reason: string;
}
