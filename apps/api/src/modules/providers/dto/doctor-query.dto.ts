import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
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
}
