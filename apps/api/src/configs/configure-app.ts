import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter';
import { ValidationException } from '../common/exceptions/validation.exception';

export function configureApp(app: INestApplication): void {
  const config = app.get(ConfigService);
  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: config.getOrThrow<string[]>('authentication.corsOrigins'),
    credentials: true,
    exposedHeaders: ['Content-Disposition'],
  });
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: ValidationException.fromValidationError,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
}
