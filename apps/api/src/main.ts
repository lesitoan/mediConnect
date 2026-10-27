import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { configureApp } from './configs/configure-app';
import { setupSwagger } from './swagger/setup-swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = app.get(Logger);
  const config = app.get(ConfigService);
  app.useLogger(logger);
  configureApp(app);
  setupSwagger(app);
  app.enableShutdownHooks();
  const port = config.getOrThrow<number>('app.port');
  await app.listen(port);
  logger.log('MediConnect API is running on port ' + port);
}

void bootstrap();
