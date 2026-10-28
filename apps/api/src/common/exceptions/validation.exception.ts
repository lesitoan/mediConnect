import { BadRequestException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

function collectMessages(errors: ValidationError[]): string[] {
  return errors.flatMap((error) => [
    ...Object.values(error.constraints ?? {}),
    ...collectMessages(error.children ?? []),
  ]);
}

export class ValidationException extends BadRequestException {
  static fromValidationError(
    this: void,
    errors: ValidationError[],
  ): ValidationException {
    const messages = collectMessages(errors);
    return new ValidationException(
      messages.length ? messages : ['Request validation failed'],
    );
  }

  constructor(readonly messages: string[]) {
    super(messages);
  }
}
