import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { AutoTrim } from '../../../../common/decorators/auto-trim.decorator';

export class CreateManualPaymentDto {
  @ApiProperty({
    example: '200000',
    description: 'Số tiền áp dụng vào hóa đơn, VND nguyên đồng',
  })
  @IsString()
  @Matches(/^[1-9]\d{0,11}$/)
  amount: string;

  @ApiProperty({ enum: ['CASH'] })
  @IsIn(['CASH'])
  method: 'CASH';

  @ApiPropertyOptional({ maxLength: 500 })
  @AutoTrim()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
