import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { AutoTrim } from '../../../../common/decorators/auto-trim.decorator';
import { UserRole } from '../../../../generated/prisma/enums';
import { normalizePhone } from '../../../../common/utils/normalize-phone';

export class UpdateUserDto {
  @ApiPropertyOptional()
  @AutoTrim()
  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^[^\p{Cc}]+$/u)
  fullName?: string;
  @ApiPropertyOptional({ nullable: true })
  @Transform(({ value }: { value: unknown }) => normalizePhone(value))
  @IsOptional()
  @Matches(/^\+84[35789]\d{8}$/)
  phone?: string | null;
  @ApiPropertyOptional({ enum: UserRole })
  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsEnum(UserRole)
  role?: UserRole;
  @ApiPropertyOptional({ format: 'uuid' })
  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsUUID('4')
  specialtyId?: string;
}
