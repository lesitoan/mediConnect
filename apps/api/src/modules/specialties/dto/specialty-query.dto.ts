import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { AutoTrim } from '../../../common/decorators/auto-trim.decorator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class SpecialtyQueryDto extends PaginationDto {
  @ApiPropertyOptional({ maxLength: 100 })
  @AutoTrim()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
