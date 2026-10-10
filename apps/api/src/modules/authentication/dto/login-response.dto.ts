import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType: string;

  @ApiProperty({
    example: 900,
    description: 'Access token lifetime in seconds',
  })
  expiresIn: number;

  @ApiProperty({
    format: 'uuid',
    description: 'ID of the persisted AuthSession',
  })
  sessionId: string;

  @ApiProperty({
    example: 2592000,
    description: 'Remaining absolute session lifetime in seconds',
  })
  refreshExpiresIn: number;

  @ApiPropertyOptional({
    description:
      'Returned only for MOBILE. WEB receives an HttpOnly refreshToken cookie.',
  })
  refreshToken?: string;
}
