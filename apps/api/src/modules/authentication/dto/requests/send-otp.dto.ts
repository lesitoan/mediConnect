import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { ContactDto } from './contact.dto';

export class SendOtpDto extends ContactDto {
  @ApiProperty({ enum: ['REGISTER', 'RESET_PASSWORD'] })
  @IsIn(['REGISTER', 'RESET_PASSWORD'])
  purpose: 'REGISTER' | 'RESET_PASSWORD';
}
