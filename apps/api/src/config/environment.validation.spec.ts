import { validateEnvironment } from './environment.validation';

const VALID_CONFIG = {
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  REDIS_URL: 'redis://localhost:6379',
  OTP_HMAC_SECRET: 'a-separate-otp-test-secret-with-at-least-32-characters',
  JWT_SECRET: 'a-unique-test-secret-with-at-least-32-characters',
};

describe('Environment validation', () => {
  it('requires an explicit Redis URL and rejects unsupported schemes', () => {
    expect(() =>
      validateEnvironment({ ...VALID_CONFIG, REDIS_URL: undefined }),
    ).toThrow();
    expect(() =>
      validateEnvironment({
        ...VALID_CONFIG,
        REDIS_URL: 'https://localhost:6379',
      }),
    ).toThrow();
    expect(() =>
      validateEnvironment({
        ...VALID_CONFIG,
        REDIS_URL: 'rediss://localhost:6379',
      }),
    ).not.toThrow();
  });
  it('requires a secret and rejects invalid JWT lifetimes', () => {
    expect(() =>
      validateEnvironment({ DATABASE_URL: VALID_CONFIG.DATABASE_URL }),
    ).toThrow();
    expect(() =>
      validateEnvironment({ ...VALID_CONFIG, JWT_ACCESS_TTL_SECONDS: -1 }),
    ).toThrow();
  });

  it('requires secure cross-site cookies and explicit origins', () => {
    expect(() =>
      validateEnvironment({ ...VALID_CONFIG, AUTH_COOKIE_SAME_SITE: 'none' }),
    ).toThrow();
    expect(() =>
      validateEnvironment({ ...VALID_CONFIG, CORS_ORIGINS: '*' }),
    ).toThrow();
    expect(() =>
      validateEnvironment({
        ...VALID_CONFIG,
        NODE_ENV: 'production',
        AUTH_COOKIE_SAME_SITE: 'none',
      }),
    ).not.toThrow();
  });

  it('sets a finite default lifetime', () => {
    expect(validateEnvironment(VALID_CONFIG).JWT_ACCESS_TTL_SECONDS).toBe(900);
    expect(validateEnvironment(VALID_CONFIG).JWT_REFRESH_TTL_SECONDS).toBe(
      2592000,
    );
  });

  it('requires a bounded refresh lifetime at least as long as the access lifetime', () => {
    for (const value of [-1, 899, 7776001]) {
      expect(() =>
        validateEnvironment({
          ...VALID_CONFIG,
          JWT_REFRESH_TTL_SECONDS: value,
        }),
      ).toThrow();
    }
    expect(() =>
      validateEnvironment({ ...VALID_CONFIG, JWT_REFRESH_TTL_SECONDS: 3600 }),
    ).not.toThrow();
  });
});
