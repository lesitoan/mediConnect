import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { CreateWorkScheduleDto } from './create-work-schedule.dto';

export class CreateWorkSchedulesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateWorkScheduleDto)
  schedules: CreateWorkScheduleDto[];
}
