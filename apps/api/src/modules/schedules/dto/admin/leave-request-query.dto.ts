import { IsEnum, IsOptional } from 'class-validator';
import {
  LeaveRequestPriority,
  LeaveRequestStatus,
  LeaveRequestType,
} from '../../../../generated/prisma/enums';

export class LeaveRequestQueryDto {
  @IsOptional()
  @IsEnum(LeaveRequestStatus)
  status?: LeaveRequestStatus;

  @IsOptional()
  @IsEnum(LeaveRequestType)
  requestType?: LeaveRequestType;

  @IsOptional()
  @IsEnum(LeaveRequestPriority)
  priority?: LeaveRequestPriority;
}
