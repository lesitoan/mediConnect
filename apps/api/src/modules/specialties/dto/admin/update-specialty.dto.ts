import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { AutoTrim } from '../../../../common/decorators/auto-trim.decorator';

export class UpdateSpecialtyDto {
  @ApiPropertyOptional({ maxLength: 20 })
  @AutoTrim()
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code?: string;

  @ApiPropertyOptional({ maxLength: 255 })
  @AutoTrim()
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ maxLength: 20 })
  @AutoTrim()
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  roomCode?: string;

  @ApiPropertyOptional({ nullable: true, maxLength: 10000 })
  @AutoTrim()
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  description?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: '200000',
    description: 'Phí khám bằng VND nguyên đồng, lớn hơn 0',
    pattern: '^[1-9]\\d{0,11}$',
  })
  @AutoTrim()
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @Matches(/^[1-9]\d{0,11}$/)
  consultationFee?: string;
}
