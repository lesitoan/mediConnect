import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HttpResponseBodySuccessDto as ApiResponseDto } from '../../common/dto/http-response-body-success.dto';
import { AuthRole } from '../authentication/decorators/auth-role.decorator';
import { CurrentUser } from '../authentication/decorators/current-user.decorator';
import { RoleEnum } from '../users/constants/roles.constant';
import type { CurrentUserDto } from '../users/dto/responses/current-user.dto';
import { CreateReviewDto } from './dto/patient/create-review.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('Patient reviews')
@Controller('me')
@AuthRole(RoleEnum.PATIENT)
export class PatientReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('reviews/eligible-visits')
  async list(@CurrentUser() user: CurrentUserDto) {
    return new ApiResponseDto(await this.reviewsService.listEligible(user));
  }

  @Get('consultations/:id/review')
  async get(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return new ApiResponseDto(await this.reviewsService.getMine(id, user));
  }

  @Post('consultations/:id/review')
  async create(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: CreateReviewDto,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return new ApiResponseDto(
      await this.reviewsService.create(id, input, user),
    );
  }
}
