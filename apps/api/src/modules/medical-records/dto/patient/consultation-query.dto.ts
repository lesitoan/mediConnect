import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, Matches } from 'class-validator';
import { PaginationDto } from '../../../../common/dto/pagination.dto';

export class ConsultationQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    format: 'date',
    description: 'Ngày bắt đầu (UTC+7); dùng cùng endDate.',
  })
  @IsOptional()
  @Matches(/^(?!0000)\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  startDate?: string;

  @ApiPropertyOptional({
    format: 'date',
    description: 'Ngày kết thúc, bao gồm cả ngày (UTC+7).',
  })
  @IsOptional()
  @Matches(/^(?!0000)\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  endDate?: string;
}
