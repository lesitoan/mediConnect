import { ValidationPipe, type Type } from '@nestjs/common';

export function validateBody<T extends object>(type: Type<T>, payload: object) {
  return new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }).transform(payload, { type: 'body', metatype: type }) as Promise<T>;
}
