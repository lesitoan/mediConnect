import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import { CareSessionStatus } from '../../generated/prisma/enums';
import { PrismaService } from '../database/services/prisma.service';

const CONSULTATION_INCLUDE = {
  review: true,
  careSession: {
    include: {
      appointment: true,
      specialty: true,
      appointmentSlot: {
        include: {
          doctorSchedule: {
            include: { doctor: { include: { user: true, specialty: true } } },
          },
        },
      },
    },
  },
} as const;

@Injectable()
export class ReviewsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPatientByUserId(userId: string) {
    return this.prisma.patient.findUnique({ where: { userId } });
  }

  findEligibleConsultations(patientId: string) {
    return this.prisma.consultation.findMany({
      where: {
        careSession: {
          status: CareSessionStatus.COMPLETED,
          appointment: { patientId },
        },
      },
      include: CONSULTATION_INCLUDE,
      orderBy: { completedAt: 'desc' },
    });
  }

  findPatientConsultation(patientId: string, consultationId: string) {
    return this.prisma.consultation.findFirst({
      where: {
        id: consultationId,
        careSession: {
          status: CareSessionStatus.COMPLETED,
          appointment: { patientId },
        },
      },
      include: CONSULTATION_INCLUDE,
    });
  }

  createReview(
    data: Prisma.ReviewUncheckedCreateInput,
    client: PrismaService | Prisma.TransactionClient,
  ) {
    return client.review.create({ data });
  }

  transaction<T>(callback: (client: Prisma.TransactionClient) => Promise<T>) {
    return this.prisma.$transaction(callback, {
      isolationLevel: 'Serializable',
    });
  }
}
