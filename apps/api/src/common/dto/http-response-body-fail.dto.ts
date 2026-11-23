import { ApiProperty } from '@nestjs/swagger';
import { HttpResponseBodyDto } from './http-response-body.dto';

export class HttpResponseBodyFailDto extends HttpResponseBodyDto {
  @ApiProperty({ example: false }) success = false;

  constructor(statusCode: number, message: string | string[], code?: string) {
    super();
    this.statusCode = statusCode;
    this.message = message;
    this.code = code;
  }
}
