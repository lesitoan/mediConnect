import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OtpChallengeDto {
  @ApiProperty() challengeId: string;
  @ApiProperty({ enum: ['EMAIL', 'ZALO'] }) channel: 'EMAIL' | 'ZALO';
  @ApiProperty() expiresIn: number;
  @ApiProperty() retryAfter: number;
  @ApiProperty() message: string;
  @ApiPropertyOptional({
    description: 'Returned only when OTP_DEV_MODE is enabled.',
  })
  developmentCode?: string;
}
