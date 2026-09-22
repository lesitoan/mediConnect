import Joi from 'joi';

const environmentSchema = Joi.object<Record<string, unknown>>({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(4000),
  LOG_LEVEL: Joi.string()
    .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent')
    .default('info'),
});

export function validateEnvironment(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const validationResult = environmentSchema.validate(config, {
    abortEarly: false,
    allowUnknown: true,
  });

  if (validationResult.error) {
    throw new Error(
      `Environment validation failed: ${validationResult.error.message}`,
    );
  }

  return validationResult.value;
}
