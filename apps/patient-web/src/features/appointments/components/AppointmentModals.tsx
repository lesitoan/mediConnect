"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Calendar,
  Check,
  ClipboardList,
  Clock,
  Info,
  MapPin,
  PhoneCall,
  Ticket,
  X,
} from "@/components/layout/icons";
import type { Appointment } from "../data";
import {
  getAppointmentAvailability,
  type AvailabilitySlot,
} from "../services/appointmentsService";
import {
  CUTOFF_HOURS,
  dayText,
  fullText,
  MAX_RESCHEDULE,
  pad,
  startOf,
} from "./dateUtils";

/* ---------- Khung popup dùng chung ---------- */

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  footer,
  wide,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className={`flex max-h-full w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ${
          wide ? "max-w-2xl" : "max-w-md"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <div className="leading-tight">
            <h3 className="text-lg font-extrabold text-slate-900">{title}</h3>
            {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
          </div>
          <button
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <footer className="flex flex-wrap justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}

const btnGhost =
  "rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";
const btnPrimary =
  "rounded-full bg-[#0A5A84] px-6 py-2.5 text-xs font-bold text-white transition hover:bg-[#08486B] disabled:cursor-not-allowed disabled:bg-slate-300";

/* ---------- 1. Chi tiết lịch hẹn ---------- */

const KIND_LABEL = {
  confirmed: { text: "Đã xác nhận", cls: "bg-emerald-50 text-emerald-700" },
  followup: { text: "Lịch tái khám", cls: "bg-blue-50 text-[#0A5A84]" },
  pending: { text: "Đang xử lý", cls: "bg-amber-50 text-amber-700" },
  completed: { text: "Đã hoàn tất", cls: "bg-slate-100 text-slate-600" },
  incomplete: { text: "Chưa hoàn tất", cls: "bg-slate-100 text-slate-600" },
  "no-show": { text: "Không đến khám", cls: "bg-amber-50 text-amber-700" },
  cancelled: { text: "Đã hủy", cls: "bg-red-50 text-red-600" },
} as const;

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#2B6CB0]">
        {icon}
      </span>
      <div className="min-w-0 leading-tight">
        <p className="text-[10px] font-bold uppercase text-slate-500">{label}</p>
        <div className="mt-1 text-sm font-bold text-slate-800">{children}</div>
      </div>
    </div>
  );
}

export function DetailModal({
  appt,
  now,
  onClose,
}: {
  appt: Appointment;
  now: Date;
  onClose: () => void;
}) {
  const start = startOf(appt, now);
  const kind = KIND_LABEL[appt.kind];
  const changes = appt.rescheduleCount ?? 0;

  return (
    <Modal
      wide
      title="Thông tin chi tiết lịch hẹn"
      subtitle={`Mã phiếu #${appt.code} • Ngày đặt ${appt.bookedAt}`}
      onClose={onClose}
      footer={
        <button type="button" onClick={onClose} className={btnPrimary}>
          Đóng
        </button>
      }
    >
      <div className="flex items-center justify-between gap-3">
        <span className={`rounded-md px-2.5 py-1 text-[11px] font-bold ${kind.cls}`}>{kind.text}</span>
        {appt.queue && appt.kind === "confirmed" && (
          <span className="flex items-center gap-1.5 rounded-md border border-blue-100 bg-blue-50/70 px-2.5 py-1 text-[11px] font-bold text-[#0A5A84]">
            <Ticket className="h-3.5 w-3.5" />
            {appt.queue}
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center gap-4 rounded-xl border border-blue-100 bg-blue-50/70 p-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2B6CB0] to-[#0A5A84] text-lg font-extrabold text-white">
          {appt.doctor.initials}
        </span>
        <div className="leading-tight">
          <span className="inline-block rounded bg-white px-2 py-0.5 text-[10px] font-bold text-[#0A5A84]">
            {appt.doctor.specialty}
          </span>
          <p className="mt-1.5 text-base font-extrabold text-slate-900">{appt.doctor.name}</p>
          <p className="mt-0.5 text-[11px] text-slate-500">{appt.doctor.title}</p>
        </div>
      </div>

      <div className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200 px-4 py-4">
        <InfoRow icon={<Clock className="h-4 w-4" />} label="Thời gian khám">
          <span className="text-[#0A5A84]">{fullText(start)}</span>
        </InfoRow>
        <InfoRow icon={<MapPin className="h-4 w-4" />} label="Phòng khám">
          {appt.room}
        </InfoRow>
        <InfoRow icon={<ClipboardList className="h-4 w-4" />} label={appt.feeLabel.replace(/:$/, "")}>
          {appt.fee}
          {appt.fee !== "Chưa có" && " VNĐ"}{" "}
          <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
            {appt.feeNote}
          </span>
        </InfoRow>
        <InfoRow icon={<PhoneCall className="h-4 w-4" />} label="Số điện thoại liên hệ">
          {appt.phone}
        </InfoRow>
        {(appt.kind === "confirmed" || appt.kind === "followup") && (
          <InfoRow icon={<Calendar className="h-4 w-4" />} label="Số lần đã đổi lịch">
            {changes}/{MAX_RESCHEDULE} lần
          </InfoRow>
        )}
      </div>

      {appt.note && (
        <p className="mt-4 flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-xs text-slate-700">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#2B6CB0]" />
          <span>
            <b>{appt.note.label}</b> {appt.note.text}
          </span>
        </p>
      )}

      {(appt.kind === "confirmed" || appt.kind === "followup") && (
        <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
          Chính sách: đổi hoặc hủy lịch tối thiểu {CUTOFF_HOURS} giờ trước giờ khám; mỗi lịch đổi
          tối đa {MAX_RESCHEDULE} lần; hủy muộn không được hoàn tiền.
        </p>
      )}
    </Modal>
  );
}

/* ---------- 2. Mã QR check-in ---------- */

/**
 * Ma trận QR GIẢ LẬP (chỉ để dựng giao diện, KHÔNG quét được).
 * TODO: thay bằng mã QR thật do backend tạo cho phiếu khám (chứa mã phiếu/token check-in).
 */
function fakeQr(seed: string, n = 25): boolean[][] {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  const rnd = () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 3266489909) >>> 0;
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
  const grid = Array.from({ length: n }, () => Array.from({ length: n }, () => rnd() > 0.5));

  const finder = (ox: number, oy: number) => {
    for (let y = -1; y <= 7; y++) {
      for (let x = -1; x <= 7; x++) {
        const gx = ox + x;
        const gy = oy + y;
        if (gx < 0 || gy < 0 || gx >= n || gy >= n) continue;
        const edge = x === -1 || y === -1 || x === 7 || y === 7;
        const ring = x === 0 || y === 0 || x === 6 || y === 6;
        const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        grid[gy][gx] = edge ? false : ring || core;
      }
    }
  };
  finder(0, 0);
  finder(n - 7, 0);
  finder(0, n - 7);
  return grid;
}

export function QrModal({
  appt,
  now,
  onClose,
}: {
  appt: Appointment;
  now: Date;
  onClose: () => void;
}) {
  const start = startOf(appt, now);
  const grid = useMemo(() => fakeQr(appt.code), [appt.code]);
  const n = grid.length;
  const quiet = 2;

  return (
    <Modal
      title="Mã QR Check-in"
      subtitle="Dùng khi đến phòng khám để tiếp đón nhanh"
      onClose={onClose}
      footer={
        <button type="button" onClick={onClose} className={btnPrimary}>
          Đóng
        </button>
      }
    >
      <div className="text-center">
        <div className="mx-auto inline-block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <svg
            viewBox={`0 0 ${n + quiet * 2} ${n + quiet * 2}`}
            className="h-52 w-52"
            shapeRendering="crispEdges"
            role="img"
            aria-label={`Mã QR check-in phiếu ${appt.code}`}
          >
            <rect width="100%" height="100%" fill="#fff" />
            {grid.map((row, y) =>
              row.map((on, x) =>
                on ? (
                  <rect key={`${x}-${y}`} x={x + quiet} y={y + quiet} width="1" height="1" fill="#0f172a" />
                ) : null,
              ),
            )}
          </svg>
        </div>
        <p className="mt-3 text-base font-extrabold text-slate-900">#{appt.code}</p>
        <p className="mt-0.5 text-[11px] font-bold text-amber-600">
          Mã minh họa giao diện, chưa dùng để quét thật
        </p>
      </div>

      <dl className="mt-4 space-y-2 rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-xs">
        <div className="flex justify-between gap-3">
          <dt className="text-slate-500">Bác sĩ</dt>
          <dd className="text-right font-bold text-slate-800">{appt.doctor.name}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-slate-500">Giờ khám</dt>
          <dd className="text-right font-bold text-[#0A5A84]">{fullText(start)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-slate-500">Phòng</dt>
          <dd className="text-right font-bold text-slate-800">{appt.room}</dd>
        </div>
      </dl>

      <p className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-slate-500">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2B6CB0]" />
        Vui lòng có mặt trước giờ hẹn 15 phút và đưa mã này cho lễ tân để check-in. Mang theo CCCD
        gắn chip và thẻ BHYT (nếu có).
      </p>
    </Modal>
  );
}

/* ---------- 3. Đổi lịch ---------- */

const DAYS_AHEAD = 10;

function buildDays(now: Date) {
  const out: Date[] = [];
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  while (out.length < DAYS_AHEAD) {
    if (d.getDay() !== 0 && d.getDay() !== 6) out.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

const toDateQuery = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export function RescheduleModal({
  appt,
  now,
  onClose,
  onConfirm,
}: {
  appt: Appointment;
  now: Date;
  onClose: () => void;
  onConfirm: (newAppointmentSlotId: string) => Promise<void>;
}) {
  const current = startOf(appt, now);
  const days = useMemo(() => buildDays(now), [now]);
  const [dayIndex, setDayIndex] = useState(0);
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(true);
  const [availabilityError, setAvailabilityError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const day = days[dayIndex];
  const used = appt.rescheduleCount ?? 0;
  const dayQuery = toDateQuery(day);
  const selectedSlot = availableSlots.find(
    (availableSlot) => availableSlot.id === selectedSlotId,
  );
  const newStart = selectedSlot ? new Date(selectedSlot.startsAt) : null;

  useEffect(() => {
    let isCurrent = true;
    getAppointmentAvailability(dayQuery, appt.doctorId)
      .then((slots) => {
        if (isCurrent) {
          setAvailableSlots(
            slots.filter(
              (slot) =>
                slot.doctor.id === appt.doctorId &&
                slot.id !== appt.appointmentSlotId,
            ),
          );
        }
      })
      .catch((availabilityError: unknown) => {
        if (isCurrent) {
          setAvailabilityError(
            availabilityError instanceof Error
              ? availabilityError.message
              : "Không thể tải khung giờ trống.",
          );
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoadingSlots(false);
      });
    return () => {
      isCurrent = false;
    };
  }, [dayQuery, appt.doctorId, appt.appointmentSlotId]);

  const submit = async () => {
    if (!selectedSlotId || !newStart || saving) return;
    setSaving(true);
    setError("");
    try {
      await onConfirm(selectedSlotId);
    } catch (submitError: unknown) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Không thể đổi lịch lúc này. Vui lòng thử lại.",
      );
      setSaving(false);
    }
  };

  return (
    <Modal
      wide
      title="Đổi lịch khám"
      subtitle={`Phiếu #${appt.code} • Còn ${MAX_RESCHEDULE - used}/${MAX_RESCHEDULE} lần đổi`}
      onClose={() => !saving && onClose()}
      footer={
        <>
          <button type="button" disabled={saving} onClick={onClose} className={btnGhost}>
            Hủy bỏ
          </button>
          <button type="button" disabled={!selectedSlotId || saving} onClick={submit} className={btnPrimary}>
            {saving ? "Đang đổi lịch..." : "Xác nhận đổi lịch"}
          </button>
        </>
      }
    >
      {/* Lịch hiện tại */}
      <p className="text-[10px] font-bold uppercase text-slate-500">Lịch hiện tại</p>
      <div className="mt-2 flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2B6CB0] to-[#0A5A84] text-sm font-extrabold text-white">
          {appt.doctor.initials}
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="text-sm font-extrabold text-slate-900">{appt.doctor.name}</p>
          <p className="mt-0.5 text-[11px] text-slate-500">{appt.doctor.specialty} • {appt.room}</p>
          <p className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Clock className="h-3.5 w-3.5 text-[#2B6CB0]" />
            {fullText(current)}
          </p>
        </div>
      </div>

      <div className="my-4 flex items-center gap-3 text-[#2B6CB0]">
        <span className="h-px flex-1 bg-slate-200" />
        <ArrowRight className="h-4 w-4 rotate-90" />
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      {/* Chọn lịch mới */}
      <p className="text-[10px] font-bold uppercase text-slate-500">Chọn lịch mới</p>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {days.map((d, i) => {
          const active = i === dayIndex;
          return (
            <button
              key={d.toISOString()}
              type="button"
              onClick={() => {
                setAvailableSlots([]);
                setSelectedSlotId(null);
                setAvailabilityError("");
                setIsLoadingSlots(true);
                setDayIndex(i);
              }}
              className={`flex w-[62px] shrink-0 flex-col items-center rounded-xl border py-2.5 transition ${
                active
                  ? "border-[#2B6CB0] bg-[#2B6CB0] text-white shadow-md"
                  : "border-slate-200 bg-white text-slate-700 hover:border-[#2B6CB0]"
              }`}
            >
              <span className={`text-[10px] font-bold ${active ? "text-white/80" : "text-slate-400"}`}>
                T{d.getDay() + 1}
              </span>
              <span className="text-xl font-extrabold leading-tight">{d.getDate()}</span>
              <span className={`text-[10px] ${active ? "text-white/80" : "text-slate-400"}`}>
                {pad(d.getMonth() + 1)}/{String(d.getFullYear()).slice(2)}
              </span>
            </button>
          );
        })}
      </div>

      {isLoadingSlots ? (
        <p className="mt-4 text-xs text-slate-500">Đang tải khung giờ trống...</p>
      ) : availabilityError ? (
        <p role="alert" className="mt-4 text-xs text-red-600">
          {availabilityError}
        </p>
      ) : availableSlots.length === 0 ? (
        <p className="mt-4 text-xs text-slate-500">
          Bác sĩ chưa có khung giờ trống trong ngày này.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {availableSlots.map((availableSlot) => {
            const slotStart = new Date(availableSlot.startsAt);
            const slotEnd = new Date(availableSlot.endsAt);
            const isSelected = selectedSlotId === availableSlot.id;
            return (
              <button
                key={availableSlot.id}
                type="button"
                onClick={() => setSelectedSlotId(availableSlot.id)}
                className={`rounded-xl border px-2 py-2 text-center transition ${
                  isSelected
                    ? "border-[#2B6CB0] bg-blue-50 ring-2 ring-[#2B6CB0]/40"
                    : "border-slate-200 bg-white hover:border-[#2B6CB0]"
                }`}
              >
                <span className="block text-xs font-bold text-slate-800">
                  {`${pad(slotStart.getHours())}:${pad(slotStart.getMinutes())} - ${pad(slotEnd.getHours())}:${pad(slotEnd.getMinutes())}`}
                </span>
                <span className="mt-0.5 block text-[10px] font-bold text-emerald-600">
                  {isSelected ? "Đang chọn" : "Còn trống"}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div
        className={`mt-5 rounded-xl border px-4 py-3 text-xs ${
          newStart ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-500"
        }`}
      >
        {newStart ? (
          <span className="flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0" />
            Lịch mới:{" "}
            <b>
              {pad(newStart.getHours())}:{pad(newStart.getMinutes())}
            </b>
            , {dayText(newStart)}
          </span>
        ) : (
          "Vui lòng chọn ngày và khung giờ mới."
        )}
      </div>

      <p className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-slate-500">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2B6CB0]" />
        Yêu cầu đổi lịch cần được thực hiện ít nhất {CUTOFF_HOURS} giờ trước giờ khám ban đầu.
        Khung giờ cũ được giải phóng sau khi đổi lịch thành công.
      </p>

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </Modal>
  );
}

/* ---------- 4. Xác nhận hủy lịch ---------- */

export function CancelModal({
  appt,
  now,
  onClose,
  onConfirm,
}: {
  appt: Appointment;
  now: Date;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const start = startOf(appt, now);

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      await onConfirm();
    } catch {
      setError("Không thể hủy lịch lúc này. Vui lòng thử lại.");
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Xác nhận hủy lịch khám"
      onClose={() => !busy && onClose()}
      footer={
        <>
          <button type="button" disabled={busy} onClick={onClose} className={btnGhost}>
            Giữ lịch
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={submit}
            className="rounded-full bg-red-600 px-6 py-2.5 text-xs font-bold text-white transition hover:bg-red-700 disabled:bg-slate-300"
          >
            {busy ? "Đang hủy..." : "Xác nhận hủy"}
          </button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-slate-600">
        Bạn sắp hủy phiếu <b>#{appt.code}</b> với <b>{appt.doctor.name}</b> lúc{" "}
        <b>{fullText(start)}</b>. Khung giờ sẽ được giải phóng và không thể hoàn tác.
      </p>
      <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-slate-700">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        Hủy muộn có thể không được hoàn tiền theo chính sách của phòng khám.
      </p>
      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </Modal>
  );
}