import {
  EXCEPTION_ERROR_MESSAGES,
  EXCEPTION_STORAGE_KEY,
  INITIAL_EXCEPTION_GROUPS,
  REPLACEMENT_DOCTORS,
} from "../constants";
import type {
  ExceptionGroup,
  ReassignmentProposalInput,
  ReplacementDoctor,
} from "../types/exceptionTypes";
import { getReplacementDoctorOptions } from "../utils";

export function createReassignmentProposal(
  groups: ExceptionGroup[],
  doctors: ReplacementDoctor[],
  input: ReassignmentProposalInput,
): ExceptionGroup[] {
  const group = groups.find((group) =>
    group.appointments.some(
      (appointment) => appointment.id === input.appointmentId,
    ),
  );
  const appointment = group?.appointments.find(
    (appointment) => appointment.id === input.appointmentId,
  );
  if (!group || !appointment)
    throw new Error(EXCEPTION_ERROR_MESSAGES.NOT_FOUND);
  if (appointment.status !== "PENDING")
    throw new Error(EXCEPTION_ERROR_MESSAGES.STATUS_CHANGED);

  const doctor = getReplacementDoctorOptions(group, appointment, doctors).find(
    (doctor) => doctor.id === input.replacementDoctorId && doctor.isAvailable,
  );
  if (!doctor) throw new Error(EXCEPTION_ERROR_MESSAGES.DOCTOR_UNAVAILABLE);

  return groups.map((group) => ({
    ...group,
    appointments: group.appointments.map((appointment) =>
      appointment.id === input.appointmentId
        ? {
            ...appointment,
            status: "AWAITING_CONFIRMATION",
            proposedDoctorId: doctor.id,
            proposedDoctorName: doctor.name,
          }
        : appointment,
    ),
  }));
}

// Demo proposals are scoped to this browser tab; patient and payment details stay in fixtures.
export function getExceptionGroups(): ExceptionGroup[] {
  const groups = structuredClone(INITIAL_EXCEPTION_GROUPS);
  if (typeof window === "undefined") return groups;
  const stored = window.sessionStorage.getItem(EXCEPTION_STORAGE_KEY);
  if (!stored) return groups;

  let proposals: unknown;
  try {
    proposals = JSON.parse(stored);
  } catch {
    return groups;
  }
  if (!proposals || typeof proposals !== "object" || Array.isArray(proposals))
    return groups;

  for (const group of groups) {
    for (const appointment of group.appointments) {
      if (appointment.status !== "PENDING") continue;
      const doctorId = (proposals as Record<string, unknown>)[appointment.id];
      const doctor = REPLACEMENT_DOCTORS.find(
        (doctor) =>
          doctor.id === doctorId &&
          doctor.specialtyId === appointment.specialtyId,
      );
      if (doctor) {
        appointment.status = "AWAITING_CONFIRMATION";
        appointment.proposedDoctorId = doctor.id;
        appointment.proposedDoctorName = doctor.name;
      }
    }
  }
  return groups;
}

export function submitReassignmentProposal(
  input: ReassignmentProposalInput,
): ExceptionGroup[] {
  if (typeof window === "undefined")
    throw new Error(EXCEPTION_ERROR_MESSAGES.BROWSER_REQUIRED);
  const groups = createReassignmentProposal(
    getExceptionGroups(),
    REPLACEMENT_DOCTORS,
    input,
  );
  const proposals = Object.fromEntries(
    groups.flatMap((group) =>
      group.appointments
        .filter((appointment) => appointment.proposedDoctorId)
        .map((appointment) => [appointment.id, appointment.proposedDoctorId]),
    ),
  );
  try {
    window.sessionStorage.setItem(
      EXCEPTION_STORAGE_KEY,
      JSON.stringify(proposals),
    );
  } catch {
    throw new Error(EXCEPTION_ERROR_MESSAGES.STORAGE_FAILED);
  }
  return groups;
}
