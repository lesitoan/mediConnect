import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AppointmentBookingSource,
  AppointmentStatus,
  CareSessionStatus,
} from '../../generated/prisma/enums';
import type { CurrentUserDto } from '../users/dto/responses/current-user.dto';
import type { AvailabilityQueryDto } from './dto/patient/availability-query.dto';
import type { BookAppointmentDto } from './dto/patient/book-appointment.dto';
import type { CancelAppointmentDto } from './dto/patient/cancel-appointment.dto';
import type { RescheduleAppointmentDto } from './dto/patient/reschedule-appointment.dto';
import { AppointmentsRepository } from './appointments.repository';

const MIN_BOOKING_NOTICE_HOURS = 2;
const APPOINTMENT_CHANGE_CUTOFF_HOURS = 12;
const MAX_RESCHEDULE_COUNT = 2;
type AppointmentSlotForResponse = NonNullable<
  Awaited<ReturnType<AppointmentsRepository['findSlotForBooking']>>
>;
const ACTIVE_SLOT_SESSION_STATUSES = [
  CareSessionStatus.SCHEDULED,
  CareSessionStatus.CHECKED_IN,
  CareSessionStatus.WAITING,
  CareSessionStatus.CALLED,
  CareSessionStatus.SKIPPED,
  CareSessionStatus.IN_CONSULTATION,
  CareSessionStatus.WAITING_LAB,
  CareSessionStatus.PAUSED,
] as const;

@Injectable()
export class AppointmentsService {
  constructor(private readonly repository: AppointmentsRepository) {}

  async getAvailability(query: AvailabilityQueryDto) {
    const date = this.parseDate(query.date);
    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(dateStart);
    dateEnd.setDate(dateEnd.getDate() + 1);

    const slots = await this.repository.findAvailableSlots(
      dateStart,
      dateEnd,
      query.specialtyId,
      query.doctorId,
    );
    const minimumStart = new Date(
      Date.now() + MIN_BOOKING_NOTICE_HOURS * 60 * 60 * 1000,
    );

    return slots
      .filter(
        (slot) =>
          slot.startsAt >= minimumStart && slot.careSessions.length === 0,
      )
      .map((slot) => this.toSlotResponse(slot));
  }

  async book(input: BookAppointmentDto, user: CurrentUserDto) {
    const patient = await this.requirePatient(user.id);
    const now = new Date();

    try {
      const appointmentId = await this.repository.transaction(
        async (client) => {
          const slot = await this.repository.findSlotForBooking(
            input.appointmentSlotId,
            client,
          );
          if (!slot) throw new NotFoundException('Appointment slot not found');
          this.assertBookableSlot(slot, now);

          const overlapping = await client.careSession.count({
            where: {
              appointment: {
                patientId: patient.id,
                status: AppointmentStatus.CONFIRMED,
              },
              status: { in: [...ACTIVE_SLOT_SESSION_STATUSES] },
              appointmentSlot: {
                startsAt: { lt: slot.endsAt },
                endsAt: { gt: slot.startsAt },
              },
            },
          });
          if (overlapping > 0)
            throw new ConflictException(
              'Patient already has an overlapping appointment',
            );

          const appointment = await this.repository.createAppointment(
            {
              appointmentCode: this.createAppointmentCode(),
              patientId: patient.id,
              bookingSource: AppointmentBookingSource.PATIENT,
              status: AppointmentStatus.CONFIRMED,
              createdBy: user.id,
            },
            client,
          );
          await this.repository.createCareSession(
            {
              appointmentId: appointment.id,
              appointmentSlotId: slot.id,
              specialtyId: slot.doctorSchedule.doctor.specialtyId,
              status: CareSessionStatus.SCHEDULED,
            },
            client,
          );

          return appointment.id;
        },
      );
      return this.repository.findPatientAppointment(patient.id, appointmentId);
    } catch (error) {
      if (this.isUniqueConstraintError(error))
        throw new ConflictException('Appointment slot is no longer available');
      throw error;
    }
  }

  async listMine(user: CurrentUserDto) {
    const patient = await this.requirePatient(user.id);
    return this.repository.findPatientAppointments(patient.id);
  }

  async getMine(id: string, user: CurrentUserDto) {
    const patient = await this.requirePatient(user.id);
    const appointment = await this.repository.findPatientAppointment(
      patient.id,
      id,
    );
    if (!appointment) throw new NotFoundException('Appointment not found');
    return appointment;
  }

  async reschedule(
    id: string,
    input: RescheduleAppointmentDto,
    user: CurrentUserDto,
  ) {
    const patient = await this.requirePatient(user.id);
    try {
      return await this.repository.transaction(async (client) => {
        const appointment = await client.appointment.findFirst({
          where: { id, patientId: patient.id },
          include: { careSessions: { include: { appointmentSlot: true } } },
        });
        if (!appointment) throw new NotFoundException('Appointment not found');
        this.assertRescheduleableAppointment(appointment);

        const session = appointment.careSessions[0];
        if (!session)
          throw new ConflictException('Appointment session not found');
        const newSlot = await this.repository.findSlotForBooking(
          input.newAppointmentSlotId,
          client,
        );
        if (!newSlot)
          throw new NotFoundException('New appointment slot not found');
        this.assertBookableSlot(newSlot, new Date());

        const overlapping = await client.careSession.count({
          where: {
            id: { not: session.id },
            appointment: {
              patientId: patient.id,
              status: AppointmentStatus.CONFIRMED,
            },
            status: { in: [...ACTIVE_SLOT_SESSION_STATUSES] },
            appointmentSlot: {
              startsAt: { lt: newSlot.endsAt },
              endsAt: { gt: newSlot.startsAt },
            },
          },
        });
        if (overlapping > 0)
          throw new ConflictException(
            'Patient already has an overlapping appointment',
          );

        await this.repository.updateCareSession(
          session.id,
          { appointmentSlotId: newSlot.id },
          client,
        );
        return this.repository.updateAppointment(
          id,
          { rescheduleCount: { increment: 1 } },
          client,
        );
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error))
        throw new ConflictException(
          'New appointment slot is no longer available',
        );
      throw error;
    }
  }

  async cancel(id: string, input: CancelAppointmentDto, user: CurrentUserDto) {
    const patient = await this.requirePatient(user.id);
    return this.repository.transaction(async (client) => {
      const appointment = await client.appointment.findFirst({
        where: { id, patientId: patient.id },
        include: { careSessions: { include: { appointmentSlot: true } } },
      });
      if (!appointment) throw new NotFoundException('Appointment not found');
      this.assertCancellableAppointment(appointment);
      const cancelledAt = new Date();
      await client.careSession.updateMany({
        where: {
          appointmentId: id,
          status: { in: [...ACTIVE_SLOT_SESSION_STATUSES] },
        },
        data: { status: CareSessionStatus.CANCELLED },
      });
      return this.repository.updateAppointment(
        id,
        {
          status: AppointmentStatus.CANCELLED,
          cancellationReason: input.reason,
          cancelledAt,
          cancelledBy: user.id,
        },
        client,
      );
    });
  }

  private async requirePatient(userId: string) {
    const patient = await this.repository.findPatientByUserId(userId);
    if (!patient) throw new NotFoundException('Patient profile not found');
    return patient;
  }

  private assertBookableSlot(
    slot: Awaited<ReturnType<AppointmentsRepository['findSlotForBooking']>>,
    now: Date,
  ): asserts slot is NonNullable<
    Awaited<ReturnType<AppointmentsRepository['findSlotForBooking']>>
  > {
    if (!slot) throw new NotFoundException('Appointment slot not found');
    if (slot.isBlocked || slot.doctorSchedule.status !== 'PUBLISHED')
      throw new ConflictException('Appointment slot is not available');
    if (
      slot.startsAt.getTime() - now.getTime() <
      MIN_BOOKING_NOTICE_HOURS * 3600000
    )
      throw new ConflictException(
        'Appointment slot must be booked at least 2 hours in advance',
      );
    if (slot.careSessions.length > 0)
      throw new ConflictException('Appointment slot is no longer available');
  }

  private assertRescheduleableAppointment(appointment: {
    status: AppointmentStatus;
    rescheduleCount: number;
    careSessions: Array<{
      status: CareSessionStatus;
      appointmentSlot?: { startsAt: Date } | null;
    }>;
  }) {
    if (appointment.status !== AppointmentStatus.CONFIRMED)
      throw new ConflictException('Appointment cannot be changed');
    if (appointment.rescheduleCount >= MAX_RESCHEDULE_COUNT)
      throw new ConflictException(
        'Appointment has reached the reschedule limit',
      );
    const session = appointment.careSessions[0];
    if (!session?.appointmentSlot)
      throw new ConflictException('Appointment slot not found');
    if (!ACTIVE_SLOT_SESSION_STATUSES.includes(session.status as never))
      throw new ConflictException(
        'Appointment cannot be changed in its current state',
      );
    if (
      session.appointmentSlot.startsAt.getTime() - Date.now() <
      APPOINTMENT_CHANGE_CUTOFF_HOURS * 3600000
    )
      throw new ConflictException(
        'Appointment can only be changed at least 12 hours before examination',
      );
  }

  private assertCancellableAppointment(appointment: {
    status: AppointmentStatus;
    careSessions: Array<{
      status: CareSessionStatus;
      appointmentSlot?: { startsAt: Date } | null;
    }>;
  }) {
    if (appointment.status !== AppointmentStatus.CONFIRMED)
      throw new ConflictException('Appointment cannot be cancelled');
    const session = appointment.careSessions[0];
    if (!session?.appointmentSlot)
      throw new ConflictException('Appointment slot not found');
    if (!ACTIVE_SLOT_SESSION_STATUSES.includes(session.status as never))
      throw new ConflictException(
        'Appointment cannot be cancelled in its current state',
      );
    if (
      session.appointmentSlot.startsAt.getTime() - Date.now() <
      APPOINTMENT_CHANGE_CUTOFF_HOURS * 3600000
    )
      throw new ConflictException(
        'Appointment can only be cancelled at least 12 hours before examination',
      );
  }

  private toSlotResponse(slot: AppointmentSlotForResponse) {
    return {
      id: slot.id,
      startsAt: slot.startsAt,
      endsAt: slot.endsAt,
      doctor: {
        id: slot.doctorSchedule.doctor.id,
        name: slot.doctorSchedule.doctor.user.fullName,
        specialty: slot.doctorSchedule.doctor.specialty,
      },
    };
  }

  private parseDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime()))
      throw new BadRequestException('Invalid date');
    return date;
  }

  private createAppointmentCode() {
    return `MDC-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;
  }

  private isUniqueConstraintError(error: unknown): boolean {
    if (typeof error !== 'object' || error === null || !('code' in error))
      return false;
    return (error as { code?: unknown }).code === 'P2002';
  }
}
