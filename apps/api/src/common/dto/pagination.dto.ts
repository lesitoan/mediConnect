import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { GET_API_CONFIG } from '../../configs/get-api.config';

export class PaginationDto {
  @ApiPropertyOptional({ default: GET_API_CONFIG.defaultPage, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(Math.floor(Number.MAX_SAFE_INTEGER / GET_API_CONFIG.maxLimitPage))
  page: number = GET_API_CONFIG.defaultPage;

  @ApiPropertyOptional({
    default: GET_API_CONFIG.defaultLimitPage,
    minimum: 1,
    maximum: GET_API_CONFIG.maxLimitPage,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(GET_API_CONFIG.maxLimitPage)
  limit: number = GET_API_CONFIG.defaultLimitPage;
}
