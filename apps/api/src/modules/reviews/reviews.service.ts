import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CurrentUserDto } from '../users/dto/responses/current-user.dto';
import type { CreateReviewDto } from './dto/patient/create-review.dto';
import { ReviewsRepository } from './reviews.repository';

@Injectable()
export class ReviewsService {
  constructor(private readonly repository: ReviewsRepository) {}

  async listEligible(user: CurrentUserDto) {
    const patient = await this.requirePatient(user.id);
    const consultations = await this.repository.findEligibleConsultations(
      patient.id,
    );
    return consultations.map((consultation) => ({
      consultation,
      canReview: !consultation.review,
    }));
  }

  async getMine(consultationId: string, user: CurrentUserDto) {
    const patient = await this.requirePatient(user.id);
    const consultation = await this.repository.findPatientConsultation(
      patient.id,
      consultationId,
    );
    if (!consultation)
      throw new NotFoundException('Completed consultation not found');
    return consultation.review;
  }

  async create(
    consultationId: string,
    input: CreateReviewDto,
    user: CurrentUserDto,
  ) {
    const patient = await this.requirePatient(user.id);
    try {
      return await this.repository.transaction(async (client) => {
        const consultation = await client.consultation.findFirst({
          where: {
            id: consultationId,
            careSession: {
              status: 'COMPLETED',
              appointment: { patientId: patient.id },
            },
          },
        });
        if (!consultation)
          throw new NotFoundException('Completed consultation not found');
        const existing = await client.review.findUnique({
          where: { consultationId },
        });
        if (existing)
          throw new ConflictException('Consultation has already been reviewed');
        return this.repository.createReview(
          {
            consultationId,
            doctorRating: input.doctorRating,
            serviceRating: input.serviceRating,
            comment: input.comment,
          },
          client,
        );
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error))
        throw new ConflictException('Consultation has already been reviewed');
      throw error;
    }
  }

  private async requirePatient(userId: string) {
    const patient = await this.repository.findPatientByUserId(userId);
    if (!patient) throw new NotFoundException('Patient profile not found');
    return patient;
  }

  private isUniqueConstraintError(error: unknown): boolean {
    if (typeof error !== 'object' || error === null || !('code' in error))
      return false;
    return (error as { code?: unknown }).code === 'P2002';
  }
}
