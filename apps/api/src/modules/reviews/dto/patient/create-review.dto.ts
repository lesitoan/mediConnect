import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  doctorRating: number;

  @IsInt()
  @Min(1)
  @Max(5)
  serviceRating: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}
