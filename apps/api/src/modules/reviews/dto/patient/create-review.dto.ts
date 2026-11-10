import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ReviewCriteriaRatingsDto {
  @IsInt()
  @Min(1)
  @Max(5)
  doctor: number;

  @IsInt()
  @Min(1)
  @Max(5)
  waiting: number;

  @IsInt()
  @Min(1)
  @Max(5)
  facility: number;

  @IsInt()
  @Min(1)
  @Max(5)
  guidance: number;
}

export class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  doctorRating: number;

  @IsInt()
  @Min(1)
  @Max(5)
  serviceRating: number;

  @ValidateNested()
  @Type(() => ReviewCriteriaRatingsDto)
  criteriaRatings: ReviewCriteriaRatingsDto;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}
