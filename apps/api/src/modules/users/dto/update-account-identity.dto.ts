import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { normalizePhone } from '../../../common/utils/normalize-phone';
import { AutoTrim } from '../../../common/decorators/auto-trim.decorator';

export class UpdateAccountIdentityDto {
  @ApiPropertyOptional({ maxLength: 100 })
  @AutoTrim()
  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^[^\p{Cc}]+$/u)
  fullName?: string;

  @ApiPropertyOptional({ example: '+84901234567' })
  @Transform(({ value }: { value: unknown }) => normalizePhone(value))
  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsString()
  @Matches(/^\+84[35789]\d{8}$/)
  phone?: string;
}
