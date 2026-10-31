import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { AutoTrim } from '../../../../common/decorators/auto-trim.decorator';
import { normalizePhone } from '../../../../common/utils/normalize-phone';
import { PatientGender } from '../../../../generated/prisma/enums';

export class UpdatePatientProfileDto {
  @ApiPropertyOptional({
    nullable: true,
    minLength: 12,
    maxLength: 12,
    description: 'Số căn cước/định danh 12 chữ số; chưa xác thực giấy tờ.',
  })
  @AutoTrim()
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{12}$/, {
    message: 'Số căn cước phải gồm đúng 12 chữ số.',
  })
  nationalId?: string | null;

  @ApiPropertyOptional({ format: 'date', nullable: true })
  @IsOptional()
  @Matches(/^(?!0000)\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  dateOfBirth?: string | null;

  @ApiPropertyOptional({ enum: PatientGender, nullable: true })
  @IsOptional()
  @IsEnum(PatientGender)
  gender?: PatientGender | null;

  @ApiPropertyOptional({ maxLength: 1000, nullable: true })
  @AutoTrim()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  @Matches(/^[^\p{Cc}]+$/u)
  address?: string | null;

  @ApiPropertyOptional({ maxLength: 100, nullable: true })
  @AutoTrim()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^[^\p{Cc}]+$/u)
  emergencyContactName?: string | null;

  @ApiPropertyOptional({ example: '0912345678', nullable: true })
  @Transform(({ value }: { value: unknown }) => normalizePhone(value))
  @IsOptional()
  @Matches(/^\+84[35789]\d{8}$/)
  emergencyContactPhone?: string | null;
}
