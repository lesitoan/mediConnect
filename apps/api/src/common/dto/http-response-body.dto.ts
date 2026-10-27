import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationResponseDto } from './pagination-response.dto';

export class HttpResponseBodyDto<T = undefined> {
  @ApiProperty() success: boolean;
  @ApiPropertyOptional({ type: Object }) data?: T;
  @ApiPropertyOptional({
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  })
  message?: string | string[];
  @ApiPropertyOptional() statusCode?: number;
  @ApiPropertyOptional() error?: string;
  @ApiPropertyOptional({ type: PaginationResponseDto })
  pagination?: PaginationResponseDto;
}
