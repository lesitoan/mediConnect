import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(Logger);
  const configService = app.get(ConfigService);

  app.useLogger(logger);
  app.setGlobalPrefix('api/v1');
  app.enableShutdownHooks();

  const port = configService.getOrThrow<number>('app.port');

  await app.listen(port);
  logger.log(`MediConnect API is running on port ${port}`);
}

void bootstrap();
