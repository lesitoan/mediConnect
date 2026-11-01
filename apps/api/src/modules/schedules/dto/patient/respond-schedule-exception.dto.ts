import { IsIn } from 'class-validator';

export class RespondScheduleExceptionDto {
  @IsIn(['ACCEPT', 'REJECT'])
  decision: 'ACCEPT' | 'REJECT';
}
