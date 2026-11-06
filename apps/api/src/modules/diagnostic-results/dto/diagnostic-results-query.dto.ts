import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class DiagnosticResultsQueryDto {
  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @IsString()
  date?: string;
  @ApiPropertyOptional({ enum: ['ALL', 'WAITING', 'IN_PROGRESS', 'COMPLETED'] })
  @IsOptional()
  @IsIn(['ALL', 'WAITING', 'IN_PROGRESS', 'COMPLETED'])
  status?: string;
  @ApiPropertyOptional({ enum: ['ALL', 'LAB', 'IMAGING', 'FUNCTION'] })
  @IsOptional()
  @IsIn(['ALL', 'LAB', 'IMAGING', 'FUNCTION'])
  category?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional({ minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;
  @ApiPropertyOptional({ minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 10;
}
