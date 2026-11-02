import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  ArrayMaxSize,
  IsBoolean,
  IsDateString,
  IsIn,
  IsJSON,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ExaminationDiagnosisDto {
  @ApiProperty({ maxLength: 30 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  code!: string;

  @ApiProperty({ maxLength: 500 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  name!: string;
}

export class ExaminationPrescriptionItemDto {
  @ApiProperty({ maxLength: 36 })
  @IsString()
  @MaxLength(36)
  id!: string;

  @ApiProperty({ maxLength: 150 })
  name!: string;

  @ApiProperty({ maxLength: 150 })
  strength!: string;

  @ApiProperty({ maxLength: 150 })
  dose!: string;

  @ApiProperty({ maxLength: 100 })
  route!: string;

  @ApiProperty({ maxLength: 150 })
  frequency!: string;

  @ApiProperty({ minimum: 1, maximum: 10000 })
  days!: number;

  @ApiProperty({ minimum: 1, maximum: 10000 })
  quantity!: number;

  @ApiProperty({ maxLength: 2000 })
  instructions!: string;
}

export class LabOrderDto {
  @ApiProperty({ maxLength: 150 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  service!: string;

  @ApiProperty({ maxLength: 1000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  purpose!: string;

  @ApiProperty({ maxLength: 1000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  instructions!: string;
}

export class HistoryConditionDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsString()
  @MaxLength(2000)
  note!: string;

  @IsBoolean()
  isConfirmed!: boolean;
}

export class UpdateExaminationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  complaint?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  clinicalNotes?: string;

  @ApiPropertyOptional({ maxLength: 533 })
  @IsOptional()
  @IsString()
  @MaxLength(533)
  diagnosis?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  diagnosisNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  history?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  surgicalHistory?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  currentMedications?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  riskFactors?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HistoryConditionDto)
  historyConditions?: HistoryConditionDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  transfer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  followUpReason?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  referralSpecialty?: string;

  @ApiPropertyOptional({ maxLength: 5000 })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  pauseReason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  patientAdvice?: string;

  @ApiPropertyOptional({ type: [ExaminationDiagnosisDto], maxItems: 20 })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  secondaryDiagnoses?: ExaminationDiagnosisDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  prescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsJSON()
  @MaxLength(20000)
  prescriptionJson?: string;

  @ApiPropertyOptional({ type: [ExaminationPrescriptionItemDto], maxItems: 50 })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  prescriptionItems?: ExaminationPrescriptionItemDto[];

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  expectedUpdatedAt?: string;

  @ApiPropertyOptional({ type: [LabOrderDto] })
  @IsOptional()
  @ValidateIf((_, value) => typeof value === 'string')
  @IsString()
  @ValidateIf((_, value) => Array.isArray(value))
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LabOrderDto)
  labOrders?: string | LabOrderDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  labReason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  labNotes?: string;

  @ApiPropertyOptional({ format: 'date', nullable: true })
  @IsOptional()
  @IsDateString()
  followUpDate?: string;

  @ApiPropertyOptional({
    enum: ['IN_PROGRESS', 'WAITING_RESULTS', 'PAUSED', 'COMPLETED'],
  })
  @IsOptional()
  @IsIn(['IN_PROGRESS', 'WAITING_RESULTS', 'PAUSED', 'COMPLETED'])
  status?: 'IN_PROGRESS' | 'WAITING_RESULTS' | 'PAUSED' | 'COMPLETED';
}
