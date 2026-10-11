process.env.NODE_ENV = 'test';
process.env.REDIS_URL = 'redis://127.0.0.1:1';
process.env.DATABASE_URL =
  'postgresql://test:test@127.0.0.1:1/mediconnect_test';
process.env.JWT_SECRET = 'test-only-secret-at-least-32-characters-long';
process.env.JWT_ACCESS_TTL_SECONDS = '900';
process.env.JWT_REFRESH_TTL_SECONDS = '2592000';
process.env.LOG_LEVEL = 'silent';
process.env.AUTH_COOKIE_SECURE = 'false';
process.env.AUTH_COOKIE_SAME_SITE = 'lax';
process.env.CORS_ORIGINS = 'http://localhost:3000,http://localhost:3001';

process.env.OTP_HMAC_SECRET =
  'test-only-otp-secret-with-at-least-32-characters';
