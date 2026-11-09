export type ExceptionStatus = "PENDING" | "AWAITING_CONFIRMATION" | "RESOLVED" | "CANCELLED";
export type ExceptionUrgency = "URGENT" | "PLANNED";
export interface ExceptionAppointment { id: string; exceptionId: string; code: string; patientId: string; patientName: string; doctorId: string; doctorName: string; specialtyId: string; specialtyName: string; room: string; startAt: string; endAt: string; startTime: string; endTime: string; status: ExceptionStatus; proposedDoctorId?: string; proposedDoctorName?: string; }
export interface ExceptionGroup { id: string; leaveRequestId: string; title: string; reason: string; date: string; urgency: ExceptionUrgency; leadTimeLabel?: string; doctorId: string; doctorCode: string; specialtyName: string; appointments: ExceptionAppointment[]; }
export interface ReplacementDoctor { id: string; name: string; specialtyId: string; specialtyName: string; room: string; isAvailable: boolean; }
export interface ReplacementDoctorOption extends ReplacementDoctor { unavailableReason: string; }
export interface ExceptionFilterValues { search: string; status: ExceptionStatus | "ALL"; urgency: ExceptionUrgency | "ALL"; page: number; pageSize: number; }
export interface ExceptionSelection { groupId: string; appointmentId: string; }
