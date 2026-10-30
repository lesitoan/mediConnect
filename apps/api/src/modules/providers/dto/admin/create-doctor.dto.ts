import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Matches,
} from 'class-validator';
import { AutoTrim } from '../../../../common/decorators/auto-trim.decorator';
import { normalizePhone } from '../../../../common/utils/normalize-phone';
import { AcademicTitle } from '../../../../generated/prisma/enums';

export class CreateDoctorDto {
  @ApiProperty({ maxLength: 100 })
  @AutoTrim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^[^\p{Cc}]+$/u)
  fullName: string;
  @ApiProperty({ example: '+84901234567' })
  @Transform(({ value }: { value: unknown }) => normalizePhone(value))
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+84[35789]\d{8}$/)
  phone: string;
  @ApiProperty({ format: 'uuid' }) @IsUUID('4') specialtyId: string;
  @ApiProperty({ maxLength: 20 })
  @AutoTrim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9]+(?:[._-][a-zA-Z0-9]+)*$/, {
    message: 'Doctor code must contain letters, numbers and single separators',
  })
  doctorCode: string;
  @ApiProperty({ maxLength: 50 })
  @AutoTrim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  licenseNumber: string;
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
