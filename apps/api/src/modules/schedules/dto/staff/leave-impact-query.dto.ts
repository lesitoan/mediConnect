import { IsDateString } from 'class-validator';

export class LeaveImpactQueryDto {
  @IsDateString()
  startsAt: string;

  @IsDateString()
  endsAt: string;
}
