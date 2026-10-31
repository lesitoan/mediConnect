import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from '../../../../common/dto/pagination.dto';
import {
  MedicalRecordType,
  PatientMedicalRecordStatus,
} from '../../../../generated/prisma/enums';

export class MedicalRecordQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: MedicalRecordType })
  @IsOptional()
  @IsEnum(MedicalRecordType)
  recordType?: MedicalRecordType;

  @ApiPropertyOptional({ enum: PatientMedicalRecordStatus })
  @IsOptional()
  @IsEnum(PatientMedicalRecordStatus)
  status?: PatientMedicalRecordStatus;
}
