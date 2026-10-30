import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SpecialtyStatusDto {
  @ApiProperty({
    description: 'False pauses the specialty; true reactivates it.',
  })
  @IsBoolean()
  isActive: boolean;
}
