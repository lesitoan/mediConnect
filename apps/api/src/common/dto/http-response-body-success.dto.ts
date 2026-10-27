import { ApiProperty } from '@nestjs/swagger';
import { HttpResponseBodyDto } from './http-response-body.dto';
import type { PaginationResponseDto } from './pagination-response.dto';

export class HttpResponseBodySuccessDto<T> extends HttpResponseBodyDto<T> {
  @ApiProperty({ example: true }) success = true;
  @ApiProperty({ type: Object }) declare data: T;

  constructor(data: T, pagination?: PaginationResponseDto) {
    super();
    this.data = data;
    if (pagination !== undefined) this.pagination = pagination;
  }
}
