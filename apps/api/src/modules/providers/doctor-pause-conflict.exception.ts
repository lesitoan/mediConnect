import {
  ArgumentsHost,
  Catch,
  ConflictException,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Response } from 'express';

interface AffectedCareSession {
  id: string;
  status: string;
  appointment: {
    id: string;
    appointmentCode: string;
    status: string;
    patient: { id: string; patientCode: string; fullName: string };
  };
  appointmentSlot: { id: string; startsAt: Date; endsAt: Date };
}

export class DoctorPauseConflictException extends ConflictException {
  constructor(affected: AffectedCareSession[]) {
    super({
      success: false,
      statusCode: 409,
      code: 'DOCTOR_PAUSE_APPOINTMENT_CONFLICT',
      message: 'Resolve affected appointments before scheduling a pause',
      affectedAppointments: affected.map((session) => ({
        careSessionId: session.id,
        careSessionStatus: session.status,
        appointmentId: session.appointment.id,
        appointmentCode: session.appointment.appointmentCode,
        appointmentStatus: session.appointment.status,
        patient: session.appointment.patient,
        slotId: session.appointmentSlot.id,
        startsAt: session.appointmentSlot.startsAt,
        endsAt: session.appointmentSlot.endsAt,
      })),
    });
  }
}

@Catch(DoctorPauseConflictException)
export class DoctorPauseConflictFilter implements ExceptionFilter {
  catch(exception: DoctorPauseConflictException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    response.setHeader('Cache-Control', 'no-store');
    response.status(exception.getStatus()).json(exception.getResponse());
  }
}
