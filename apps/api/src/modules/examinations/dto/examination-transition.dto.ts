import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ExaminationVersionDto {
  @ApiProperty({ format: 'date-time' })
  @IsDateString()
  @IsNotEmpty()
  expectedUpdatedAt!: string;
}

export class PauseExaminationDto extends ExaminationVersionDto {
  @ApiProperty({ maxLength: 1000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason!: string;
}

export class IncompleteExaminationDto extends PauseExaminationDto {
  @ApiProperty({ maxLength: 5000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  plan!: string;
}

export class ConfirmMedicalRecordDto extends ExaminationVersionDto {}
