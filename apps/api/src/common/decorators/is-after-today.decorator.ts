import { registerDecorator, type ValidationOptions } from 'class-validator';

export function IsAfterToday(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (object: object, propertyName: string): void => {
    registerDecorator({
      name: 'isAfterToday',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          return typeof value === 'string' && Date.parse(value) > Date.now();
        },
        defaultMessage: () => `${propertyName} must be a future date`,
      },
    });
  };
}
