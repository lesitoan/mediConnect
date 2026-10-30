import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
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
}
