import { ApiProperty } from '@nestjs/swagger';

export class OtpChallengeDto {
  @ApiProperty() challengeId: string;
  @ApiProperty({ enum: ['EMAIL', 'ZALO'] }) channel: 'EMAIL' | 'ZALO';
  @ApiProperty() expiresIn: number;
  @ApiProperty() retryAfter: number;
  @ApiProperty() message: string;
}
