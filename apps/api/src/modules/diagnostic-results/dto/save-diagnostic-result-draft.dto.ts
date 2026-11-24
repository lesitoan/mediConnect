import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';
import { DiagnosticOrderActionDto } from './diagnostic-order-action.dto';

export class SaveDiagnosticResultDraftDto extends DiagnosticOrderActionDto {
  @ApiProperty({ maxLength: 10000 })
  @IsString()
  @MaxLength(10000)
  result!: string;
}
