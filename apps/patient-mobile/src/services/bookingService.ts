export type CreateAppointmentPayload = {
  profileId: string;
  serviceId: string;
  doctorId: string;
  dateKey: string;
  slotId: string;
  startTime: string;
  endTime: string;
  note: string;
};

export type CreatedAppointment = {
  id: string;
  code: string;
};

export async function createAppointment(
  payload: CreateAppointmentPayload,
): Promise<CreatedAppointment> {
  return {
    id: `appointment-${payload.slotId}`,
    code: `LK-${String(Date.now()).slice(-6)}`,
  };
}