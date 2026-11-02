import { IsDateString } from 'class-validator';

export class WorkScheduleMatrixQueryDto {
  @IsDateString()
  from: string;

  @IsDateString()
  to: string;
}
