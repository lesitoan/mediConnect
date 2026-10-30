import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { NextFunction, Request, Response } from 'express';
import { createHash } from 'node:crypto';
import {
  SWAGGER_API_DESCRIPTION,
  SWAGGER_API_PATH,
  SWAGGER_API_TITLE,
  SWAGGER_API_VERSION,
} from '../common/constants/swagger.constant';

export function setupSwagger(app: INestApplication): void {
  app.use(
    [
      `/${SWAGGER_API_PATH}/swagger-ui-init.js`,
      `/${SWAGGER_API_PATH}/docs/swagger-ui-init.js`,
      `/${SWAGGER_API_PATH}-json`,
      `/${SWAGGER_API_PATH}-yaml`,
    ],
    (_request: Request, response: Response, next: NextFunction) => {
      response.setHeader('Cache-Control', 'no-store');
      next();
    },
  );
  const appConfig = app.get(ConfigService);
  const config = new DocumentBuilder()
    .setTitle(SWAGGER_API_TITLE)
    .setDescription(SWAGGER_API_DESCRIPTION)
    .setVersion(SWAGGER_API_VERSION)
    .addBearerAuth()
    .addCookieAuth(appConfig.getOrThrow<string>('authentication.cookieName'))
    .build();
  const document = SwaggerModule.createDocument(app, config);
  const documentVersion = createHash('sha256')
    .update(JSON.stringify(document))
    .digest('hex')
    .slice(0, 16);
  SwaggerModule.setup(SWAGGER_API_PATH, app, document, {
    // Load last so this replaces the onload handler from any stale CDN script.
    customJs: `/${SWAGGER_API_PATH}/swagger-ui-init.js?v=${documentVersion}`,
  });
}
