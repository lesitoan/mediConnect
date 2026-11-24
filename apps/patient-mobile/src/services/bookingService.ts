import { requestApi } from './apiClient';

export type CreateAppointmentPayload = {
  appointmentSlotId: string;
  note: string;
};

export type CreatedAppointment = {
  id: string;
  code: string;
};

export async function createAppointment(
  payload: CreateAppointmentPayload,
): Promise<CreatedAppointment> {
  const response = await requestApi<{
    id: string;
    appointmentCode: string;
  }>(
    '/me/appointments',
    {
      method: 'POST',
      body: JSON.stringify({
        appointmentSlotId: payload.appointmentSlotId,
        reason: payload.note || undefined,
      }),
    },
    true,
  );
  return {
    id: response.id,
    code: response.appointmentCode,
  };
}