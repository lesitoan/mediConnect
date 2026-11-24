import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  IsIn,
  Matches,
  MaxLength,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { AutoTrim } from '../../../common/decorators/auto-trim.decorator';

export class DoctorQueryDto extends PaginationDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  specialtyId?: string;
  @ApiPropertyOptional({ maxLength: 100 })
  @AutoTrim()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsOptional()
  @IsBoolean()
  hasAcademicTitle?: boolean;

  @ApiPropertyOptional({ pattern: '^\\d{4}-\\d{2}-\\d{2}$' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  availabilityDate?: string;

  @ApiPropertyOptional({ enum: ['RATING', 'EXPERIENCE'] })
  @IsOptional()
  @IsIn(['RATING', 'EXPERIENCE'])
  sortBy?: 'RATING' | 'EXPERIENCE';
}
