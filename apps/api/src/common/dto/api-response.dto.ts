import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T> {
  @ApiProperty({ example: true })
  success: boolean;

  data: T;

  constructor(data: T) {
    this.success = true;
    this.data = data;
  }
}
