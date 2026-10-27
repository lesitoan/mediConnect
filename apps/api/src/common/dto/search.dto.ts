import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { AutoTrim } from '../decorators/auto-trim.decorator';

export class SearchDto {
  @ApiPropertyOptional()
  @AutoTrim()
  @IsOptional()
  @IsString()
  keyword?: string;
}
