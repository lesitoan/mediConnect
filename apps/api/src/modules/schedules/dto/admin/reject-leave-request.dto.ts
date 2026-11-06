import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RejectLeaveRequestDto {
  @IsString()
  @Matches(/\S/, {
    message:
      'rejectionReason must contain at least one non-whitespace character',
  })
  @MinLength(1)
  @MaxLength(2000)
  rejectionReason: string;
}
