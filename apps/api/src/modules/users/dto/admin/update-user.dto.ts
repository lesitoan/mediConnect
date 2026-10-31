import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsUUID,
  Matches,
  ValidateIf,
} from 'class-validator';
import { UserRole } from '../../../../generated/prisma/enums';
import { normalizePhone } from '../../../../common/utils/normalize-phone';
import { UpdateMeDto } from '../me/update-me.dto';

export class UpdateUserDto extends UpdateMeDto {
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
