import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsByteLength,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { AuthSessionClientType } from '../../../../generated/prisma/enums';
import { AutoTrim } from '../../../../common/decorators/auto-trim.decorator';
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
  @AutoTrim()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  deviceName?: string;
}
