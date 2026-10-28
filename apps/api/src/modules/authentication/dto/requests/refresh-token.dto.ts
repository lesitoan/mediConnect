import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class RefreshTokenDto {
  @ApiPropertyOptional({
    description:
      'Refresh token for MOBILE or API tests. WEB sends {} and uses its HttpOnly cookie.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(4096)
  @Matches(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/)
  refreshToken?: string;
}
