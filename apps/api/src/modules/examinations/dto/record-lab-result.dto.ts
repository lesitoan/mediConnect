import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsArray,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DiagnosticResultImageDto {
  @ApiProperty() @IsString() @IsNotEmpty() url!: string;
  @ApiProperty() @IsString() @IsNotEmpty() publicId!: string;
  @ApiProperty() @IsString() @IsNotEmpty() name!: string;
  @ApiProperty() @IsDateString() uploadedAt!: string;
  @ApiProperty() @IsString() @IsNotEmpty() uploadedBy!: string;
}

export class RecordLabResultDto {
  @ApiProperty({ maxLength: 150 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  orderRef!: string;

  @ApiProperty({ maxLength: 10000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  result!: string;

  @ApiProperty({ maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  source!: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  returnedAt?: string;

  @ApiProperty({ format: 'date-time' })
  @IsNotEmpty()
  @IsDateString()
  expectedUpdatedAt!: string;

  @ApiPropertyOptional({ type: [DiagnosticResultImageDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DiagnosticResultImageDto)
  images?: DiagnosticResultImageDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  completeOrder?: boolean;
}
