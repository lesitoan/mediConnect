import { registerAs } from '@nestjs/config';

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  expiresInSeconds: Number(process.env.JWT_ACCESS_TTL_SECONDS ?? 900),
  refreshExpiresInSeconds: Number(
    process.env.JWT_REFRESH_TTL_SECONDS ?? 2592000,
  ),
  issuer: 'mediconnect-api',
  audience: 'mediconnect',
  refreshAudience: 'mediconnect-refresh',
}));
