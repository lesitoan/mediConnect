import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { AutoTrim } from '../../../../common/decorators/auto-trim.decorator';

export class CreateSpecialtyDto {
  @ApiProperty({ maxLength: 20 })
  @AutoTrim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code: string;

  @ApiProperty({ maxLength: 255 })
  @AutoTrim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ maxLength: 20 })
  @AutoTrim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  roomCode: string;

  @ApiPropertyOptional({ nullable: true, maxLength: 10000 })
  @AutoTrim()
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  description?: string | null;

  @ApiProperty({
    type: String,
    example: '200000',
    description: 'Phí khám bằng VND nguyên đồng, lớn hơn 0',
    pattern: '^[1-9]\\d{0,11}$',
  })
  @AutoTrim()
  @IsString()
  @Matches(/^[1-9]\d{0,11}$/)
  consultationFee: string;
}
