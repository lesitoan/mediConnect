import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AutoTrim } from '../../../../common/decorators/auto-trim.decorator';
import { PaginationDto } from '../../../../common/dto/pagination.dto';
import { UserRole, UserStatus } from '../../../../generated/prisma/enums';

export class UserQueryDto extends PaginationDto {
  @ApiPropertyOptional()
  @AutoTrim()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;
  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  specialtyId?: string;
}
