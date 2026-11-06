import { ApiProperty } from '@nestjs/swagger';
import { IsByteLength, IsString } from 'class-validator';
import { ContactDto } from './contact.dto';

export class RequestContactChangeDto extends ContactDto {
  @ApiProperty({ format: 'password' })
  @IsString()
  @IsByteLength(1, 72)
  currentPassword: string;
}
