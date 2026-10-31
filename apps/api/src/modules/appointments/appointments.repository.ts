import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import {
  CareSessionStatus,
  DoctorScheduleStatus,
} from '../../generated/prisma/enums';
import { PrismaService } from '../database/services/prisma.service';

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

  findAvailableSlots(
    dateStart: Date,
    dateEnd: Date,
    specialtyId?: string,
    doctorId?: string,
  ) {
    return this.prisma.appointmentSlot.findMany({
      where: {
        startsAt: { gte: dateStart, lt: dateEnd },
        isBlocked: false,
        doctorSchedule: {
          status: DoctorScheduleStatus.PUBLISHED,
          doctor: {
            isActive: true,
            ...(doctorId ? { id: doctorId } : {}),
            ...(specialtyId ? { specialtyId } : {}),
            user: { status: 'ACTIVE', deletedAt: null },
          },
        },
      },
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
          include: { doctor: { include: { user: true, specialty: true } } },
        },
      },
      orderBy: [{ startsAt: 'asc' }],
    });
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
          include: { doctor: { include: { user: true, specialty: true } } },
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
      include: APPOINTMENT_INCLUDE,
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
      include: APPOINTMENT_INCLUDE,
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
    return this.prisma.$transaction(callback, {
      isolationLevel: 'Serializable',
    });
  }
}
