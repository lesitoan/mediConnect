import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsJSON,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
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
  historyConditions?: Array<{
    name: string;
    note: string;
    isConfirmed: boolean;
  }>;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  patientAdvice?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  secondaryDiagnoses?: Array<{ code: string; name: string }>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  prescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsJSON()
  prescriptionJson?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  labOrders?: string;

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
  @IsString()
  status?: 'IN_PROGRESS' | 'WAITING_RESULTS' | 'PAUSED' | 'COMPLETED';
}
