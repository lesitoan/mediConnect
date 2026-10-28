import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, Matches } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  challengeId: string;

  @ApiProperty({ example: '123456', pattern: '^\\d{6}$' })
  @IsString()
  @Matches(/^\d{6}$/)
  otp: string;
}
