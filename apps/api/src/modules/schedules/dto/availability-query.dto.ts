import { IsIn, IsOptional, IsString, Matches } from 'class-validator';
import { PublicSearchQueryDto } from '../../../common/dto/public-search-query.dto';

export class AvailabilityQueryDto extends PublicSearchQueryDto {
  @IsOptional()
  @IsIn(['MORNING', 'AFTERNOON', 'EVENING'])
  timePeriod?: 'MORNING' | 'AFTERNOON' | 'EVENING';

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dateFrom: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dateTo: string;
}
