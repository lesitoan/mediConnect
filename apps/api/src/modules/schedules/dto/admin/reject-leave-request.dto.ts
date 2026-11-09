import { IsString, MaxLength, MinLength } from 'class-validator';

export class RejectLeaveRequestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  rejectionReason: string;
}
