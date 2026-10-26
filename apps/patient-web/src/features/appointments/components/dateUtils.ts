import type { Appointment } from "../data";

export const WEEKDAYS = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
export const CUTOFF_HOURS = 2; // đổi/hủy tối thiểu 2 giờ trước giờ khám (SRS)
export const MAX_RESCHEDULE = 2; // mỗi lịch đổi tối đa 2 lần (SRS)

export const pad = (n: number) => String(n).padStart(2, "0");

export function startOf(a: Appointment, now: Date) {
  const [h, m] = a.time.split(":").map(Number);
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + a.daysFromNow, h, m);
}

export const dayText = (d: Date) =>
  `${WEEKDAYS[d.getDay()]}, ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;

export const fullText = (d: Date) =>
  `${pad(d.getHours())}:${pad(d.getMinutes())} - ${d.getHours() < 12 ? "Sáng" : "Chiều"} ${dayText(d)}`;

export const minToText = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

/** Đổi lịch/hủy được khi còn ≥ 2 giờ trước giờ khám */
export function withinCutoff(a: Appointment, now: Date) {
  return startOf(a, now).getTime() - now.getTime() >= CUTOFF_HOURS * 3600_000;
}

export function canReschedule(a: Appointment, now: Date) {
  return withinCutoff(a, now) && (a.rescheduleCount ?? 0) < MAX_RESCHEDULE;
}