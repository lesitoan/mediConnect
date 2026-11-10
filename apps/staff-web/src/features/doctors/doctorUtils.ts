import {
  DOCTOR_PAGE_SIZE_OPTIONS,
  type DoctorFilterValues,
} from "./types/doctorTypes";
import type { AffectedAppointment } from "./types/doctorTypes";
export { getApiErrorMessage as getDoctorApiError } from "@/lib/api/apiErrorMessage";

export function formatClinicTime(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}

export function normalizeDoctorPhone(value: string): string {
  const phone = value.replace(/[ .()-]/g, "");
  return phone.startsWith("0")
    ? "+84" + phone.slice(1)
    : phone.startsWith("84")
      ? "+" + phone
      : phone;
}

export function doctorChanges(
  previous: import("./types/doctorTypes").Doctor,
  next: import("./types/doctorTypes").DoctorWriteInput,
) {
  return Object.fromEntries(
    Object.entries(next).filter(
      ([key, value]) =>
        (key === "fullName" || key === "phone"
          ? previous.user[key]
          : previous[
              key as Exclude<keyof typeof next, "fullName" | "phone">
            ]) !== value,
    ),
  );
}

export function buildPauseInterval(
  startsAt: string,
  endsAt: string,
  isIndefinite: boolean,
  now = Date.now(),
): { startsAt: string; endsAt: string | null } {
  const parse = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
    const iso = `${value}:00+07:00`;
    const timestamp = Date.parse(iso);
    if (
      !Number.isFinite(timestamp) ||
      new Date(timestamp + 7 * 60 * 60 * 1000).toISOString().slice(0, 16) !==
        value
    )
      return null;
    return { iso, timestamp };
  };
  const start = parse(startsAt);
  if (!start || start.timestamp <= now)
    throw new Error("Thời gian bắt đầu phải nằm trong tương lai.");
  const end = isIndefinite ? null : parse(endsAt);
  if (!isIndefinite && (!end || end.timestamp <= start.timestamp))
    throw new Error("Thời gian kết thúc phải sau thời gian bắt đầu.");
  return { startsAt: start.iso, endsAt: end?.iso ?? null };
}

export function getPauseConflict(error: unknown): AffectedAppointment[] | null {
  if (
    !error ||
    typeof error !== "object" ||
    !("status" in error) ||
    error.status !== 409 ||
    !("data" in error)
  )
    return null;
  const data: unknown = error.data;
  if (
    !data ||
    typeof data !== "object" ||
    !("code" in data) ||
    data.code !== "DOCTOR_PAUSE_APPOINTMENT_CONFLICT" ||
    !("affectedAppointments" in data) ||
    !Array.isArray(data.affectedAppointments)
  )
    return null;
  const items: unknown[] = data.affectedAppointments;
  if (
    !items.every((value) => {
      if (
        !value ||
        typeof value !== "object" ||
        !("patient" in value) ||
        !value.patient ||
        typeof value.patient !== "object"
      )
        return false;
      return (
        "careSessionId" in value &&
        typeof value.careSessionId === "string" &&
        "appointmentCode" in value &&
        typeof value.appointmentCode === "string" &&
        "startsAt" in value &&
        typeof value.startsAt === "string" &&
        Number.isFinite(Date.parse(value.startsAt)) &&
        "endsAt" in value &&
        typeof value.endsAt === "string" &&
        Number.isFinite(Date.parse(value.endsAt)) &&
        "patientCode" in value.patient &&
        typeof value.patient.patientCode === "string" &&
        "fullName" in value.patient &&
        typeof value.patient.fullName === "string"
      );
    })
  )
    return null;
  return items as AffectedAppointment[];
}

export function getCatalogQuery(filters: DoctorFilterValues) {
  const tab: DoctorFilterValues["tab"] =
    filters.tab === "SPECIALTIES" ? "SPECIALTIES" : "DOCTORS";
  const page =
    Number.isSafeInteger(filters.page) &&
    filters.page > 0 &&
    filters.page <= Math.floor(Number.MAX_SAFE_INTEGER / 100)
      ? filters.page
      : 1;
  const limit =
    DOCTOR_PAGE_SIZE_OPTIONS.find((size) => size === filters.pageSize) ?? 6;
  const specialtyId =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      filters.specialty,
    )
      ? filters.specialty
      : "";
  const search = filters.search.trim().slice(0, 100) || undefined;
  return { tab, page, limit, specialtyId, search };
}

export function formatDoctorName(
  doctor: Pick<import("./types/doctorTypes").Doctor, "academicTitle" | "user">,
): string {
  const name = doctor.user.fullName.trim();
  if (/^(?:PGS|GS)\./i.test(name)) return name;
  const title =
    doctor.academicTitle === "PROFESSOR"
      ? "GS."
      : doctor.academicTitle === "ASSOCIATE_PROFESSOR"
        ? "PGS."
        : "";
  return title ? title + " " + name : name;
}
