import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { PatientGender } from '../../../../generated/prisma/enums';
import { AutoTrim } from '../../../../common/decorators/auto-trim.decorator';
import { PasswordDto } from './password.dto';

export class RegisterDto extends PasswordDto {
  @ApiProperty({ example: 'Nguyen Van An' })
  @AutoTrim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: '0912345678' })
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') return value;
    const phone = value.trim().replace(/[ -]/g, '');
    if (phone.startsWith('0')) return '+84' + phone.slice(1);
    return phone.startsWith('84') ? '+' + phone : phone;
  })
  @IsString()
  @Matches(/^\+84[35789]\d{8}$/)
  phone: string;

  @ApiPropertyOptional({ example: 'patient@gmail.com' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @IsDateString({ strict: true })
  dateOfBirth?: string;

  @ApiPropertyOptional({ enum: PatientGender })
  @IsOptional()
  @IsEnum(PatientGender)
  gender?: PatientGender;
}
