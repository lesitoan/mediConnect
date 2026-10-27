import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VerifyOtpResponseDto {
  @ApiProperty({ enum: ['REGISTER', 'RESET_PASSWORD'] }) purpose:
    'REGISTER' | 'RESET_PASSWORD';
  @ApiPropertyOptional() activated?: boolean;
  @ApiPropertyOptional() resetToken?: string;
  @ApiPropertyOptional() expiresIn?: number;
}
