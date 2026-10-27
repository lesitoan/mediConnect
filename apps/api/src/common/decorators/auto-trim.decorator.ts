import { Transform } from 'class-transformer';

export function AutoTrim(): PropertyDecorator {
  return Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'string') return value.trim();
    if (Array.isArray(value)) {
      return value.map((item: unknown) =>
        typeof item === 'string' ? item.trim() : item,
      );
    }
    return value;
  });
}
