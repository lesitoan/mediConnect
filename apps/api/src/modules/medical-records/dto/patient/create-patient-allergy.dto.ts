import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { AllergySeverity } from '../../../../generated/prisma/enums';
import { AutoTrim } from '../../../../common/decorators/auto-trim.decorator';

export class CreatePatientAllergyDto {
  @ApiProperty({ maxLength: 255 })
  @AutoTrim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ enum: AllergySeverity })
  @IsOptional()
  @IsEnum(AllergySeverity)
  severity?: AllergySeverity;

  @ApiPropertyOptional()
  @AutoTrim()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @AutoTrim()
  @IsOptional()
  @IsString()
  reaction?: string;
}
