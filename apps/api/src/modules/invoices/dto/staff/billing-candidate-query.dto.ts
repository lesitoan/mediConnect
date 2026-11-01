import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { AutoTrim } from '../../../../common/decorators/auto-trim.decorator';
import { PaginationDto } from '../../../../common/dto/pagination.dto';

export class BillingCandidateQueryDto extends PaginationDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  patientId?: string;

  @ApiPropertyOptional({
    maxLength: 100,
    description: 'Tìm theo mã lịch, mã bệnh nhân, tên hoặc số điện thoại',
  })
  @AutoTrim()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({
    format: 'date',
    description: 'Ngày hoàn tất bắt đầu, UTC+7; phải gửi cùng completedTo',
  })
  @IsOptional()
  @Matches(/^(?!0000)\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  completedFrom?: string;

  @ApiPropertyOptional({
    format: 'date',
    description: 'Ngày hoàn tất kết thúc, bao gồm ngày này; UTC+7',
  })
  @IsOptional()
  @Matches(/^(?!0000)\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  completedTo?: string;
}
