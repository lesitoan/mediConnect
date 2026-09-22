import { ConfigService } from '@nestjs/config';
import type { Params } from 'nestjs-pino';

const REDACTED_LOG_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["x-api-key"]',
  'req.body.accessToken',
  'req.body.currentPassword',
  'req.body.newPassword',
  'req.body.password',
  'req.body.refreshToken',
  'res.headers["set-cookie"]',
];

export function createLoggerConfig(configService: ConfigService): Params {
  const environment = configService.getOrThrow<string>('app.environment');
  const logLevel = configService.getOrThrow<string>('app.logLevel');
  const isDevelopment = environment === 'development';

  return {
    pinoHttp: {
      level: logLevel,
      redact: {
        censor: '[REDACTED]',
        paths: REDACTED_LOG_PATHS,
      },
      transport: isDevelopment
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              ignore: 'pid,hostname',
              singleLine: true,
              translateTime: 'SYS:standard',
            },
          }
        : undefined,
    },
  };
}
