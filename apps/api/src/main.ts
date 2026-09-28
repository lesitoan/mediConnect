import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
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

  const isSwaggerEnabled =
    configService.getOrThrow<boolean>('app.swaggerEnabled');

  if (isSwaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('MediConnect API')
      .setDescription('REST API documentation for MediConnect')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        'access-token',
      )
      .build();

    const documentFactory = () =>
      SwaggerModule.createDocument(app, swaggerConfig);

    SwaggerModule.setup('docs', app, documentFactory, {
      jsonDocumentUrl: 'docs/openapi.json',
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  const port = configService.getOrThrow<number>('app.port');

  await app.listen(port);
  logger.log(`MediConnect API is running on port ${port}`);
}

void bootstrap();
