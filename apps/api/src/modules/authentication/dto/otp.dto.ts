import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsString, IsUUID, Matches } from 'class-validator';
import { ContactDto } from './contact.dto';
import { PasswordDto } from './password.dto';

export class SendOtpDto extends ContactDto {
  @ApiProperty({ enum: ['REGISTER', 'RESET_PASSWORD'] })
  @IsIn(['REGISTER', 'RESET_PASSWORD'])
  purpose: 'REGISTER' | 'RESET_PASSWORD';
}

export class VerifyOtpDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  challengeId: string;

  @ApiProperty({ example: '123456', pattern: '^\\d{6}$' })
  @IsString()
  @Matches(/^\d{6}$/)
  otp: string;
}

export class ResetPasswordDto extends PasswordDto {
  @ApiProperty({
    description:
      'Frontend automatically passes the one-use resetToken returned by /verify. This is not OTP and is never entered manually by the user. password is the NEW password.',
  })
  @IsString()
  @Matches(/^[a-f0-9]{64}$/)
  resetToken: string;
}

export class OtpChallengeDto {
  @ApiProperty() challengeId: string;
  @ApiProperty({ enum: ['EMAIL', 'ZALO'] }) channel: 'EMAIL' | 'ZALO';
  @ApiProperty() expiresIn: number;
  @ApiProperty() retryAfter: number;
  @ApiProperty() message: string;
}

export class VerifyOtpResponseDto {
  @ApiProperty({ enum: ['REGISTER', 'RESET_PASSWORD'] }) purpose:
    'REGISTER' | 'RESET_PASSWORD';
  @ApiPropertyOptional() activated?: boolean;
  @ApiPropertyOptional() resetToken?: string;
  @ApiPropertyOptional() expiresIn?: number;
}
