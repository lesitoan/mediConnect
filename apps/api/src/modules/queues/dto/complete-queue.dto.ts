import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty } from 'class-validator';

export class CompleteQueueDto {
  @ApiProperty({ format: 'date-time' })
  @IsDateString()
  @IsNotEmpty()
  expectedUpdatedAt!: string;
}
