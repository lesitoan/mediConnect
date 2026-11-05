import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import { CareSessionStatus } from '../../generated/prisma/enums';
import { retryTransaction } from '../../common/utils/retry-transaction';
import { PrismaService } from '../database/services/prisma.service';
import {
  hasPatientBookingOverlap,
  lockBookingResources,
} from '../database/utils/booking-locks';

type DatabaseClient = PrismaService | Prisma.TransactionClient;

const APPOINTMENT_INCLUDE = {
  patient: {
    select: {
      id: true,
      userId: true,
      patientCode: true,
      fullName: true,
      dateOfBirth: true,
      gender: true,
      phone: true,
      email: true,
      address: true,
      emergencyContactName: true,
      emergencyContactPhone: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  careSessions: {
    include: {
      specialty: true,
      consultation: { include: { review: true } },
      appointmentSlot: {
        include: {
          doctorSchedule: {
            include: { doctor: { include: { user: true, specialty: true } } },
          },
        },
      },
    },
  },
  invoices: true,
} as const;

@Injectable()
export class AppointmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPatientByUserId(userId: string) {
    return this.prisma.patient.findUnique({ where: { userId } });
  }

  findSlotForBooking(slotId: string, client: DatabaseClient = this.prisma) {
    return client.appointmentSlot.findUnique({
      where: { id: slotId },
      include: {
        careSessions: {
          where: {
            status: {
              notIn: [CareSessionStatus.CANCELLED, CareSessionStatus.NO_SHOW],
            },
          },
          select: { id: true },
        },
        doctorSchedule: {
          select: {
            status: true,
            doctorId: true,
            doctor: { select: { specialtyId: true } },
          },
        },
      },
    });
  }

  findPatientAppointments(patientId: string) {
    return this.prisma.appointment.findMany({
      where: { patientId },
      include: APPOINTMENT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async hasPatientOverlap(
    client: Prisma.TransactionClient,
    patientId: string,
    startsAt: Date,
    endsAt: Date,
    activeStatuses: readonly CareSessionStatus[],
    excludedSessionId?: string,
  ): Promise<boolean> {
    return hasPatientBookingOverlap(
      client,
      this.prisma.schemaName,
      patientId,
      startsAt,
      endsAt,
      activeStatuses,
      excludedSessionId,
    );
  }

  lockResources(
    client: Prisma.TransactionClient,
    patientId: string,
    appointmentId?: string,
    slotIds: string[] = [],
  ) {
    return lockBookingResources(client, this.prisma.schemaName, {
      patientId,
      appointmentId,
      slotIds,
    });
  }

  findPatientAppointment(patientId: string, appointmentId: string) {
    return this.prisma.appointment.findFirst({
      where: { id: appointmentId, patientId },
      include: APPOINTMENT_INCLUDE,
    });
  }

  createAppointment(
    data: Prisma.AppointmentUncheckedCreateInput,
    client: DatabaseClient,
  ) {
    return client.appointment.create({
      data,
      select: { id: true },
    });
  }

  createCareSession(
    data: Prisma.CareSessionUncheckedCreateInput,
    client: DatabaseClient,
  ) {
    return client.careSession.create({ data });
  }

  updateAppointment(
    appointmentId: string,
    data: Prisma.AppointmentUncheckedUpdateInput,
    client: DatabaseClient,
  ) {
    return client.appointment.update({
      where: { id: appointmentId },
      data,
      select: { id: true },
    });
  }

  updateCareSession(
    careSessionId: string,
    data: Prisma.CareSessionUncheckedUpdateInput,
    client: DatabaseClient,
  ) {
    return client.careSession.update({ where: { id: careSessionId }, data });
  }

  transaction<T>(callback: (client: Prisma.TransactionClient) => Promise<T>) {
    return retryTransaction(
      () =>
        this.prisma.$transaction(callback, {
          isolationLevel: 'ReadCommitted',
          maxWait: 5000,
          timeout: 15000,
        }),
      'Appointments',
    );
  }
}
