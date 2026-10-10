import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ContactDto } from './contact.dto';
import { PasswordDto } from './password.dto';

export class RegisterDto extends IntersectionType(ContactDto, PasswordDto) {
  @ApiProperty({ example: 'Nguyen Van An' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}
