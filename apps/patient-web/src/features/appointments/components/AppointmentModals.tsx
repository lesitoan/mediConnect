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
  Sun,
  Sunset,
  Ticket,
  X,
} from "@/components/layout/icons";
import type { Appointment } from "../data";
import {
  CUTOFF_HOURS,
  dayText,
  fullText,
  MAX_RESCHEDULE,
  minToText,
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
  completed: { text: "Đã hoàn tất", cls: "bg-slate-100 text-slate-600" },
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
          {appt.fee} VNĐ{" "}
          <span className="ml-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
            {appt.feeNote}
          </span>
        </InfoRow>
        <InfoRow icon={<PhoneCall className="h-4 w-4" />} label="SMS & QR xác nhận gửi tới">
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

const SESSIONS = [
  { key: "morning", label: "Buổi sáng", Ico: Sun, start: 420, end: 660 },
  { key: "afternoon", label: "Buổi chiều", Ico: Sunset, start: 810, end: 960 },
] as const;

const SLOT_MIN = 30;
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

/** TODO: thay bằng API số lượt còn trống theo bác sĩ/ngày/khung giờ */
function mockRemaining(key: string, from: number) {
  let h = 0;
  for (const c of key + from) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const r = h % 10;
  return r < 2 ? 0 : r - 1;
}

const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

export function RescheduleModal({
  appt,
  now,
  onClose,
  onConfirm,
}: {
  appt: Appointment;
  now: Date;
  onClose: () => void;
  onConfirm: (daysFromNow: number, time: string) => Promise<void>;
}) {
  const current = startOf(appt, now);
  const days = useMemo(() => buildDays(now), [now]);
  const [dayIndex, setDayIndex] = useState(0);
  const [slot, setSlot] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const day = days[dayIndex];
  const used = appt.rescheduleCount ?? 0;
  const cutoff = now.getTime() + CUTOFF_HOURS * 3600_000;

  const statusOf = (m: number) => {
    const at = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, m).getTime();
    if (at === current.getTime()) return "current" as const;
    if (at < cutoff) return "expired" as const;
    const remaining = mockRemaining(`${appt.doctor.name}|${midnight(day)}`, m);
    return remaining === 0 ? ("full" as const) : ("ok" as const);
  };

  const remainingOf = (m: number) => mockRemaining(`${appt.doctor.name}|${midnight(day)}`, m);

  const newStart =
    slot === null ? null : new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, slot);

  const submit = async () => {
    if (slot === null || !newStart || saving) return;
    setSaving(true);
    setError("");
    try {
      const daysFromNow = Math.round((midnight(day) - midnight(now)) / 86_400_000);
      await onConfirm(daysFromNow, `${pad(newStart.getHours())}:${pad(newStart.getMinutes())}`);
    } catch {
      setError("Không thể đổi lịch lúc này. Vui lòng thử lại.");
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
          <button type="button" disabled={slot === null || saving} onClick={submit} className={btnPrimary}>
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
                setDayIndex(i);
                setSlot(null);
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

      {SESSIONS.map(({ key, label, Ico, start, end }) => {
        const ms: number[] = [];
        for (let m = start; m < end; m += SLOT_MIN) ms.push(m);
        return (
          <div key={key} className="mt-4">
            <p className="flex items-center gap-1.5 text-xs font-extrabold text-slate-700">
              <Ico className="h-4 w-4 text-amber-500" />
              {label}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {ms.map((m) => {
                const st = statusOf(m);
                const active = slot === m;
                const disabled = st !== "ok";
                return (
                  <button
                    key={m}
                    type="button"
                    disabled={disabled}
                    onClick={() => setSlot(m)}
                    className={`rounded-xl border px-2 py-2 text-center transition ${
                      active
                        ? "border-[#2B6CB0] bg-blue-50 ring-2 ring-[#2B6CB0]/40"
                        : disabled
                          ? "cursor-not-allowed border-slate-100 bg-slate-50"
                          : "border-slate-200 bg-white hover:border-[#2B6CB0]"
                    }`}
                  >
                    <span
                      className={`block text-xs font-bold ${
                        active ? "text-[#174A8F]" : disabled ? "text-slate-400 line-through" : "text-slate-800"
                      }`}
                    >
                      {minToText(m)} - {minToText(m + SLOT_MIN)}
                    </span>
                    <span
                      className={`mt-0.5 block text-[10px] font-bold ${
                        active
                          ? "text-[#2B6CB0]"
                          : st === "ok"
                            ? "text-emerald-600"
                            : st === "full"
                              ? "text-rose-500"
                              : "text-slate-400"
                      }`}
                    >
                      {active
                        ? "Đang chọn"
                        : st === "current"
                          ? "Lịch hiện tại"
                          : st === "expired"
                            ? "Hết giờ nhận"
                            : st === "full"
                              ? "Đã hết chỗ"
                              : `Còn ${remainingOf(m)} lượt`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <div
        className={`mt-5 rounded-xl border px-4 py-3 text-xs ${
          newStart ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-500"
        }`}
      >
        {newStart ? (
          <span className="flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0" />
            Lịch mới: <b>{minToText(slot!)} - {minToText(slot! + SLOT_MIN)}</b>, {dayText(newStart)}
          </span>
        ) : (
          "Vui lòng chọn ngày và khung giờ mới."
        )}
      </div>

      <p className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-slate-500">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2B6CB0]" />
        Chỉ nhận lịch mới từ hiện tại + {CUTOFF_HOURS} giờ trở đi. Khung giờ cũ sẽ được giải phóng
        sau khi đổi lịch thành công.
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