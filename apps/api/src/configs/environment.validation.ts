import Joi from 'joi';

const ENVIRONMENT_SCHEMA = Joi.object<Record<string, unknown>>({
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgres', 'postgresql'] })
    .required(),
  REDIS_URL: Joi.string()
    .uri({ scheme: ['redis', 'rediss'] })
    .required(),
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(4000),
  AI_SERVICE_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .default('http://127.0.0.1:4100'),
  AI_INTERNAL_TOKEN: Joi.string().min(32).empty('').optional(),
  LOG_LEVEL: Joi.string()
    .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent')
    .default('info'),
  OTP_HMAC_SECRET: Joi.string()
    .min(32)
    .invalid(Joi.ref('JWT_SECRET'))
    .required(),
  ZALO_OTP_CODE_PARAM: Joi.string()
    .pattern(/^[a-zA-Z][a-zA-Z0-9_]*$/)
    .empty('')
    .optional(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_TTL_SECONDS: Joi.number()
    .integer()
    .min(60)
    .max(86400)
    .default(900),
  JWT_REFRESH_TTL_SECONDS: Joi.number()
    .integer()
    .min(Joi.ref('JWT_ACCESS_TTL_SECONDS'))
    .max(7776000)
    .default(2592000),
  CORS_ORIGINS: Joi.string()
    .custom((value: string, helpers) => {
      const origins = value.split(',').map((origin) => origin.trim());
      const isValid = origins.every((origin) => {
        try {
          const url = new URL(origin);
          return (
            ['http:', 'https:'].includes(url.protocol) && url.origin === origin
          );
        } catch {
          return false;
        }
      });
      return isValid ? value : helpers.error('any.invalid');
    })
    .default('http://localhost:3000,http://localhost:3001'),
  AUTH_COOKIE_SECURE: Joi.string().valid('true', 'false').default('false'),
  AUTH_COOKIE_SAME_SITE: Joi.string()
    .valid('lax', 'strict', 'none')
    .default('lax'),
});

export function validateEnvironment(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const result = ENVIRONMENT_SCHEMA.validate(config, {
    abortEarly: false,
    allowUnknown: true,
  });
  if (result.error)
    throw new Error('Environment validation failed: ' + result.error.message);
  const values = result.value;
  if (
    values.AUTH_COOKIE_SAME_SITE === 'none' &&
    values.AUTH_COOKIE_SECURE !== 'true' &&
    values.NODE_ENV !== 'production'
  ) {
    throw new Error(
      'AUTH_COOKIE_SAME_SITE=none requires AUTH_COOKIE_SECURE=true',
    );
  }
  return values;
}
