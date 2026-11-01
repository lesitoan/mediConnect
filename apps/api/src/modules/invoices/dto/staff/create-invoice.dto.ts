import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateInvoiceDto {
  @ApiProperty({ format: 'uuid', description: 'ID của phiên khám đã hoàn tất' })
  @IsUUID('4')
  consultationId: string;
}
