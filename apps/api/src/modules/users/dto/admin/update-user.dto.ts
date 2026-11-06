import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsUUID, ValidateIf } from 'class-validator';
import { UserRole } from '../../../../generated/prisma/enums';
import { UpdateMeDto } from '../me/update-me.dto';

export class UpdateUserDto extends UpdateMeDto {
  @ApiPropertyOptional({ enum: UserRole })
  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsEnum(UserRole)
  role?: UserRole;
  @ApiPropertyOptional({ format: 'uuid' })
  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsUUID('4')
  specialtyId?: string;
}
