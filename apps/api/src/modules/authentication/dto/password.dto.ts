import { ApiProperty } from '@nestjs/swagger';
import { IsByteLength, IsString, Matches, MinLength } from 'class-validator';

export class PasswordDto {
  @ApiProperty({ format: 'password', minLength: 8, maxLength: 72 })
  @IsString()
  @MinLength(8)
  @IsByteLength(8, 72)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).+$/, {
    message:
      'Password must contain uppercase, lowercase, number and special characters',
  })
  password: string;
}
