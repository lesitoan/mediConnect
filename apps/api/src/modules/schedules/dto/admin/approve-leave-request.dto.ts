import { IsOptional, IsUUID } from 'class-validator';

export class ApproveLeaveRequestDto {
  @IsOptional()
  @IsUUID()
  replacementDoctorId?: string;
}
