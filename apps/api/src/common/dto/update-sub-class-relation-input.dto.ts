import type { Type } from '@nestjs/common';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type as TransformType } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';

// A generic type alone cannot give class-transformer the nested DTO at runtime.
export function createRelationUpdateDto<T extends object>(dto: Type<T>) {
  class UpdateSubClassRelationInputDto {
    @ApiPropertyOptional({ type: () => dto })
    @IsOptional()
    @ValidateNested()
    @TransformType(() => dto)
    update?: T;
  }
  Object.defineProperty(UpdateSubClassRelationInputDto, 'name', {
    value: `Update${dto.name}RelationInputDto`,
  });
  return UpdateSubClassRelationInputDto;
}
