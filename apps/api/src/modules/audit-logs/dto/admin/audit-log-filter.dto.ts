import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import {
  AuditActorType,
  AuditLogResult,
} from '../../../../generated/prisma/enums';
import { PaginationDto } from '../../../../common/dto/pagination.dto';
import { AutoTrim } from '../../../../common/decorators/auto-trim.decorator';

export class AuditLogFilterDto {
  @ApiPropertyOptional({ example: '2026-10-01' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-10-31' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  endDate?: string;

  @ApiPropertyOptional({ enum: AuditActorType })
  @IsOptional()
  @IsEnum(AuditActorType)
  actorType?: AuditActorType;

  @ApiPropertyOptional()
  @AutoTrim()
  @IsOptional()
  @IsUUID('4')
  actorUserId?: string;

  @ApiPropertyOptional()
  @AutoTrim()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  actionCode?: string;

  @ApiPropertyOptional()
  @AutoTrim()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  module?: string;

  @ApiPropertyOptional()
  @AutoTrim()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  targetType?: string;

  @ApiPropertyOptional()
  @AutoTrim()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  targetId?: string;

  @ApiPropertyOptional({ enum: AuditLogResult })
  @IsOptional()
  @IsEnum(AuditLogResult)
  result?: AuditLogResult;

  @ApiPropertyOptional()
  @AutoTrim()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;
}

export class AuditLogQueryDto extends IntersectionType(
  AuditLogFilterDto,
  PaginationDto,
) {}
