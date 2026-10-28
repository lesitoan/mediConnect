import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { AutoTrim } from '../../../../common/decorators/auto-trim.decorator';
import { ContactDto } from './contact.dto';
import { PasswordDto } from './password.dto';

export class RegisterDto extends IntersectionType(ContactDto, PasswordDto) {
  @ApiProperty({ example: 'Nguyen Van An' })
  @AutoTrim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}
