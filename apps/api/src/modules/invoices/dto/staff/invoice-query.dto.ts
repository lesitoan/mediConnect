import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { InvoiceStatus } from '../../../../generated/prisma/client';
import { AutoTrim } from '../../../../common/decorators/auto-trim.decorator';
import { PaginationDto } from '../../../../common/dto/pagination.dto';

export const PAYMENT_STATUSES = [
  'UNPAID',
  'PARTIALLY_PAID',
  'PAID',
  'OVERPAID',
  'PARTIALLY_REFUNDED',
  'REFUNDED',
] as const;

export class InvoiceQueryDto extends PaginationDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  patientId?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @AutoTrim()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ enum: InvoiceStatus })
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @ApiPropertyOptional({ enum: PAYMENT_STATUSES })
  @IsOptional()
  @IsIn(PAYMENT_STATUSES)
  paymentStatus?: (typeof PAYMENT_STATUSES)[number];

  @ApiPropertyOptional({
    format: 'date',
    description: 'Ngày lập từ, UTC+7; dùng cùng createdTo',
  })
  @IsOptional()
  @Matches(/^(?!0000)\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  createdFrom?: string;

  @ApiPropertyOptional({
    format: 'date',
    description: 'Ngày lập đến, bao gồm cả ngày, UTC+7',
  })
  @IsOptional()
  @Matches(/^(?!0000)\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  createdTo?: string;
}
