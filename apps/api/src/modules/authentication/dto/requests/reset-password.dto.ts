import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';
import { PasswordDto } from './password.dto';

export class ResetPasswordDto extends PasswordDto {
  @ApiProperty({
    description:
      'Frontend automatically passes the one-use resetToken returned by /verify. This is not OTP and is never entered manually by the user. password is the NEW password.',
  })
  @IsString()
  @Matches(/^[a-f0-9]{64}$/)
  resetToken: string;
}
