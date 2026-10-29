import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { PatientReviewsController } from './patient-reviews.controller';
import { ReviewsRepository } from './reviews.repository';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [DatabaseModule],
  controllers: [PatientReviewsController],
  providers: [ReviewsRepository, ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
