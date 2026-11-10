import { ApiProperty } from '@nestjs/swagger';
import { IsByteLength, IsString } from 'class-validator';
import { PasswordDto } from './password.dto';

export class ChangePasswordDto extends PasswordDto {
  @ApiProperty({ format: 'password', minLength: 1, maxLength: 72 })
  @IsString()
  @IsByteLength(1, 72)
  currentPassword: string;
}
