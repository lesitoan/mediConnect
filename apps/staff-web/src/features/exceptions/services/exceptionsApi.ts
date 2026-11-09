import { baseApi } from "@/lib/redux/baseApi";
import type { ApiResponse } from "@/types/apiTypes";
import type { Doctor } from "../../doctors/types/doctorTypes";
import type { ExceptionAppointment, ExceptionGroup } from "../types/exceptionTypes";

interface BackendException {
  id: string; status: "PENDING_REASSIGNMENT" | "PROPOSED" | "RESOLVED" | "RESCHEDULE_REQUIRED" | "CANCELLED"; resolution: "REASSIGNED" | "RESCHEDULED" | "CANCELLED" | null; leaveRequestId: string; originalDoctor: { id: string; doctorCode: string; user: { fullName: string }; specialty: { id: string; name: string } }; leaveRequest: { priority: "NORMAL" | "URGENT"; reason: string };
  careSession: { appointment: { id: string; appointmentCode: string; patient: { patientCode: string; fullName: string } }; appointmentSlot: { startsAt: string; endsAt: string } };
  reassignments: Array<{ status: string; toDoctorId: string | null; toDoctor: { user: { fullName: string } } | null }>;
}

function formatTime(value: string) { return new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(value)); }
function mapStatus(item: BackendException): ExceptionAppointment["status"] { if (item.status === "PENDING_REASSIGNMENT") return "PENDING"; if (item.status === "PROPOSED") return "AWAITING_CONFIRMATION"; if (item.status === "CANCELLED" || item.resolution === "CANCELLED") return "CANCELLED"; return "RESOLVED"; }

function mapGroups(items: BackendException[]): ExceptionGroup[] {
  const groups = new Map<string, ExceptionGroup>();
  for (const item of items) {
    const doctor = item.originalDoctor;
    const slot = item.careSession.appointmentSlot;
    const proposal = item.reassignments.find((entry) => entry.status === "PROPOSED");
    const appointment: ExceptionAppointment = { id: item.careSession.appointment.id, exceptionId: item.id, code: item.careSession.appointment.appointmentCode, patientId: item.careSession.appointment.patient.patientCode, patientName: item.careSession.appointment.patient.fullName, doctorId: doctor.id, doctorName: doctor.user.fullName, specialtyId: doctor.specialty.id, specialtyName: doctor.specialty.name, room: "", startAt: slot.startsAt, endAt: slot.endsAt, startTime: formatTime(slot.startsAt), endTime: formatTime(slot.endsAt), status: mapStatus(item), proposedDoctorId: proposal?.toDoctorId ?? undefined, proposedDoctorName: proposal?.toDoctor?.user.fullName ?? undefined };
    const current = groups.get(item.leaveRequestId);
    if (current) current.appointments.push(appointment);
    else groups.set(item.leaveRequestId, { id: item.leaveRequestId, leaveRequestId: item.leaveRequestId, title: `${doctor.user.fullName} vắng`, reason: item.leaveRequest.reason, date: slot.startsAt.slice(0, 10), urgency: item.leaveRequest.priority === "URGENT" ? "URGENT" : "PLANNED", doctorId: doctor.id, doctorCode: doctor.doctorCode, specialtyName: doctor.specialty.name, appointments: [appointment] });
  }
  return [...groups.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export const exceptionsApi = baseApi.enhanceEndpoints({ addTagTypes: ["APPOINTMENT_EXCEPTIONS"] }).injectEndpoints({
  endpoints: (build) => ({
    getExceptionGroups: build.query<ExceptionGroup[], void>({ query: () => ({ url: "/admin/schedule-exceptions" }), transformResponse: (response: ApiResponse<BackendException[]>) => mapGroups(response.data), providesTags: [{ type: "APPOINTMENT_EXCEPTIONS", id: "LIST" }] }),
    getReplacementDoctors: build.query<Doctor[], { specialtyId: string }>({ query: ({ specialtyId }) => ({ url: "/admin/doctors", params: { specialtyId, page: 1, limit: 100 } }), transformResponse: (response: ApiResponse<Doctor[]>) => response.data }),
    proposeException: build.mutation<void, { exceptionId: string; resolution: "REASSIGNED" | "CANCELLED"; toDoctorId?: string; reason?: string }>({ query: ({ exceptionId, ...data }) => ({ url: `/admin/schedule-exceptions/${encodeURIComponent(exceptionId)}/propose`, method: "POST", data }), invalidatesTags: [{ type: "APPOINTMENT_EXCEPTIONS", id: "LIST" }] }),
  }),
});

export const { useGetExceptionGroupsQuery, useGetReplacementDoctorsQuery, useProposeExceptionMutation } = exceptionsApi;
