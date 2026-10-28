import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import {
  SWAGGER_API_DESCRIPTION,
  SWAGGER_API_PATH,
  SWAGGER_API_TITLE,
  SWAGGER_API_VERSION,
} from '../common/constants/swagger.constant';

export function setupSwagger(app: INestApplication): void {
  const appConfig = app.get(ConfigService);
  const config = new DocumentBuilder()
    .setTitle(SWAGGER_API_TITLE)
    .setDescription(SWAGGER_API_DESCRIPTION)
    .setVersion(SWAGGER_API_VERSION)
    .addBearerAuth()
    .addCookieAuth(appConfig.getOrThrow<string>('authentication.cookieName'))
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(SWAGGER_API_PATH, app, document);
}
