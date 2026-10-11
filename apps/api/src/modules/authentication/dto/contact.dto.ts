import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  Matches,
  MaxLength,
  Validate,
  ValidateIf,
  ValidatorConstraint,
  type ValidationArguments,
  type ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'exactlyOneContact' })
class ExactlyOneContact implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const input = args.object as ContactDto;
    return (input.email !== undefined) !== (input.phone !== undefined);
  }
  defaultMessage(): string {
    return 'Provide exactly one of email or phone';
  }
}

export class ContactDto {
  @ApiPropertyOptional({
    example: 'patient@gmail.com',
    description: 'Supply email OR phone, never both.',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @ValidateIf(
    (input: ContactDto) =>
      input.email !== undefined || input.phone === undefined,
  )
  @Validate(ExactlyOneContact)
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @ApiPropertyOptional({
    example: '+84901234567',
    description: 'Vietnamese mobile number: 09…, 849… or +849….',
  })
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') return value;
    const phone = value.trim().replace(/[ -]/g, '');
    if (phone.startsWith('0')) return '+84' + phone.slice(1);
    return phone.startsWith('84') ? '+' + phone : phone;
  })
  @ValidateIf((input: ContactDto) => input.phone !== undefined)
  @Validate(ExactlyOneContact)
  @Matches(/^\+84[35789]\d{8}$/)
  phone?: string;
}
