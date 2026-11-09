import type { ApiError } from "@/types/apiTypes";
import { formatDate } from "@/lib/utils";
import { EXCEPTION_ERROR_MESSAGES } from "./constants";
import type { ExceptionAppointment, ExceptionFilterValues, ExceptionGroup, ExceptionStatus } from "./types/exceptionTypes";
export function formatExceptionDate(date: string) { return formatDate(`${date}T00:00:00`); }
export function normalizeExceptionSearch(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/đ/gi, "d").replace(/[\s-]+/g, ""); }
export function filterExceptionGroups(groups: ExceptionGroup[], filters: ExceptionFilterValues) { const search = normalizeExceptionSearch(filters.search); return groups.map((group) => ({ ...group, appointments: group.appointments.filter((appointment) => (filters.status === "ALL" || filters.status === appointment.status) && (!search || [appointment.patientName, appointment.patientId, appointment.code, group.title, group.doctorCode].some((value) => normalizeExceptionSearch(value).includes(search)))) })).filter((group) => (filters.urgency === "ALL" || filters.urgency === group.urgency) && group.appointments.length > 0); }
export function getExceptionStatusVariant(status: ExceptionStatus): "danger" | "warning" | "success" | "neutral" { if (status === "PENDING") return "danger"; if (status === "AWAITING_CONFIRMATION") return "warning"; if (status === "RESOLVED") return "success"; return "neutral"; }
export function getExceptionErrorMessage(error: unknown) { return typeof error === "object" && error !== null && "message" in error && typeof error.message === "string" ? error.message : EXCEPTION_ERROR_MESSAGES.OPERATION_FAILED; }
export function toExceptionError(error: unknown): ApiError { return { status: "FETCH_ERROR", message: getExceptionErrorMessage(error), data: null }; }
export function buildReassignmentNotification(group: ExceptionGroup, appointment: ExceptionAppointment, doctorName: string) { return `Lịch hẹn ${appointment.code} của ${appointment.patientName} với ${appointment.doctorName} lúc ${appointment.startTime}–${appointment.endTime} ngày ${formatExceptionDate(group.date)} sẽ được đề xuất chuyển sang ${doctorName}.`; }
