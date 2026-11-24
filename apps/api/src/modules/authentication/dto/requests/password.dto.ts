import { ApiProperty } from '@nestjs/swagger';
import { IsByteLength, IsString, Matches, MinLength } from 'class-validator';

const PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).+$/;
const PASSWORD_VALIDATION_MESSAGE =
  'Password must contain uppercase, lowercase, number and special characters';

export class PasswordDto {
  @ApiProperty({ format: 'password', minLength: 8, maxLength: 72 })
  @IsString()
  @MinLength(8)
  @IsByteLength(8, 72)
  @Matches(PASSWORD_PATTERN, {
    message: PASSWORD_VALIDATION_MESSAGE,
  })
  password!: string; 
}

export class ChangePasswordDto {
  @ApiProperty({ format: 'password' })
  @IsString()
  currentPassword!: string; 

  @ApiProperty({ format: 'password', minLength: 8, maxLength: 72 })
  @IsString()
  @MinLength(8)
  @IsByteLength(8, 72)
  @Matches(PASSWORD_PATTERN, {
    message: PASSWORD_VALIDATION_MESSAGE,
  })
  newPassword!: string; 
}