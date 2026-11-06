import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { PaginationDto } from '../../../../common/dto/pagination.dto';

export class DoctorDetailQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: ['INFO', 'SCHEDULE', 'HISTORY', 'REVIEWS'],
    default: 'INFO',
  })
  @IsOptional()
  @IsIn(['INFO', 'SCHEDULE', 'HISTORY', 'REVIEWS'])
  tab: 'INFO' | 'SCHEDULE' | 'HISTORY' | 'REVIEWS' = 'INFO';
}
