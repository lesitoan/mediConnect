import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Matches,
  ValidateIf,
} from 'class-validator';
import { AutoTrim } from '../../../../common/decorators/auto-trim.decorator';
import { AcademicTitle } from '../../../../generated/prisma/enums';

export class UpdateDoctorDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsUUID('4')
  specialtyId?: string;
  @ApiPropertyOptional({ maxLength: 20 })
  @AutoTrim()
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9]+(?:[._-][a-zA-Z0-9]+)*$/, {
    message: 'Doctor code must contain letters, numbers and single separators',
  })
  doctorCode?: string;
  @ApiPropertyOptional({ maxLength: 50 })
  @AutoTrim()
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  licenseNumber?: string;
  @ApiPropertyOptional({ enum: AcademicTitle, nullable: true })
  @IsOptional()
  @IsEnum(AcademicTitle)
  academicTitle?: AcademicTitle | null;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  qualification?: string | null;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  bio?: string | null;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string | null;
}
