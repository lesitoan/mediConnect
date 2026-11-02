import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateReferralDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  targetSpecialtyName!: string;

  @ApiProperty({ maxLength: 5000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  reason!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  requestedDoctorId?: string;

  @ApiProperty({ enum: ['NORMAL', 'URGENT'] })
  @IsIn(['NORMAL', 'URGENT'])
  priority!: 'NORMAL' | 'URGENT';

  @ApiProperty({ format: 'date-time' })
  @IsDateString()
  @IsNotEmpty()
  expectedUpdatedAt!: string;
}
