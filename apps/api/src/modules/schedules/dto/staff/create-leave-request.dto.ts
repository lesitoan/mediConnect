import {
  IsDateString,
  IsEnum,
  Matches,
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
  @Matches(/\S/, {
    message: 'reason must contain at least one non-whitespace character',
  })
  @MinLength(1)
  @MaxLength(2000)
  reason: string;
}
