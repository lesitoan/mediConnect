import { registerAs } from '@nestjs/config';

export const authenticationConfig = registerAs('authentication', () => ({
  cookieName: 'accessToken',
  refreshCookieName: 'refreshToken',
  isCookieSecure:
    process.env.AUTH_COOKIE_SECURE === 'true' ||
    process.env.NODE_ENV === 'production',
  cookieSameSite: process.env.AUTH_COOKIE_SAME_SITE ?? 'lax',
  corsOrigins: (
    process.env.CORS_ORIGINS ?? 'http://localhost:3000,http://localhost:3001'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
}));
