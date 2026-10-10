import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsByteLength,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { AuthSessionClientType } from '../../../generated/prisma/enums';
import { ContactDto } from './contact.dto';
export class LoginDto extends ContactDto {
  @ApiProperty({ format: 'password' })
  @IsString()
  @IsNotEmpty()
  @IsByteLength(1, 72)
  password: string;

  @ApiPropertyOptional({
    enum: AuthSessionClientType,
    default: AuthSessionClientType.WEB,
  })
  @IsEnum(AuthSessionClientType)
  clientType: AuthSessionClientType = AuthSessionClientType.WEB;

  @ApiPropertyOptional({ maxLength: 255 })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  deviceName?: string;
}
