"use client";

import {
  Calendar,
  Clock,
  Eye,
  FileText,
  MapPin,
  QrCode,
  Star,
  X,
} from "@/components/layout/icons";
import type { Appointment } from "../data";
import {
  canReschedule,
  CUTOFF_HOURS,
  MAX_RESCHEDULE,
  startOf,
  withinCutoff,
} from "./dateUtils";

const BUTTON_CLASS =
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-2.5 py-2 text-[11px] font-bold transition disabled:cursor-not-allowed disabled:opacity-50";

type Props = {
  appt: Appointment;
  now: Date;
  onDetail: (a: Appointment) => void;
  onQr: (a: Appointment) => void;
  onReschedule: (a: Appointment) => void;
  onCancel: (a: Appointment) => void;
  onReview: (a: Appointment) => void;
  onMedicalRecord: (a: Appointment) => void;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

function formatTimeRange(start: Date) {
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  const format = new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Ho_Chi_Minh",
  });
  return `${format.format(start)} - ${format.format(end)}`;
}

export default function AppointmentHistoryCard({
  appt,
  now,
  onDetail,
  onQr,
  onReschedule,
  onCancel,
  onReview,
  onMedicalRecord,
}: Props) {
  const start = startOf(appt, now);
  const isUpcoming = appt.kind === "confirmed" || appt.kind === "followup";
  const isCompleted = appt.kind === "completed";
  const isCancelled = appt.kind === "cancelled";
  const isWithinCutoff = withinCutoff(appt, now);
  const canChange = isUpcoming && canReschedule(appt, now);
  const cancelLock = isWithinCutoff
    ? undefined
    : `Chỉ hủy được trước giờ khám tối thiểu ${CUTOFF_HOURS} giờ`;
  const changeLock = !isWithinCutoff
    ? `Chỉ đổi được trước giờ khám tối thiểu ${CUTOFF_HOURS} giờ`
    : `Lịch này đã đổi tối đa ${MAX_RESCHEDULE} lần`;

  return (
    <article className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_5px_18px_rgba(28,79,132,0.08)] transition hover:shadow-[0_8px_22px_rgba(28,79,132,0.12)] sm:p-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(220px,1.05fr)_minmax(280px,1.3fr)_minmax(280px,350px)] lg:items-center">
        <div className="flex min-w-0 items-center gap-3 border-b border-slate-100 pb-3 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E5F1FC] to-[#D5E8F8] text-base font-extrabold text-[#0A5A84]">
            {appt.doctor.initials}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-extrabold text-[#102B55]">
              {appt.doctor.name}
            </h3>
            <p className="mt-1 truncate text-[11px] font-semibold text-slate-600">
              {appt.doctor.specialty}
            </p>
            {appt.doctor.title && (
              <p className="mt-1 truncate text-[10px] text-slate-400">
                {appt.doctor.title}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-2 border-b border-slate-100 pb-3 text-xs text-[#16345E] sm:grid-cols-2 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-4">
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-bold">
              <Calendar className="h-4 w-4 shrink-0 text-[#0A5A84]" />
              <span className="truncate">{formatDate(start)}</span>
            </p>
            <p className="mt-2 flex items-center gap-2 font-bold">
              <Clock className="h-4 w-4 shrink-0 text-[#0A5A84]" />
              {formatTimeRange(start)}
              <span className="font-normal text-slate-400">(30 phút)</span>
            </p>
          </div>
          <div>
            <p className="flex items-center gap-2 font-bold">
              <MapPin className="h-4 w-4 shrink-0 text-[#0A5A84]" />
              {appt.room}
            </p>
            <p className="mt-2 text-[10px] text-slate-400">Mã lịch: {appt.code}</p>
          </div>
        </div>

        <div
          className={
            isCompleted
              ? "flex w-full max-w-[480px] gap-2 lg:justify-start [&>button]:w-auto [&>button]:min-w-0 [&>button]:flex-1"
              : isCancelled
                ? "flex w-full max-w-[240px] justify-start"
                : "grid w-full max-w-[350px] grid-cols-2 gap-2"
          }
        >
          {isUpcoming && appt.kind === "confirmed" && (
            <button
              type="button"
              onClick={() => onQr(appt)}
              className={`${BUTTON_CLASS} w-full bg-[#0A5A84] text-white hover:bg-[#08486B]`}
            >
              <QrCode className="h-3.5 w-3.5" />
              QR Check-in
            </button>
          )}
          {isUpcoming && (
            <>
              <button
                type="button"
                disabled={!canChange}
                title={canChange ? undefined : changeLock}
                onClick={() => onReschedule(appt)}
                className={`${BUTTON_CLASS} w-full border border-blue-200 bg-blue-50 text-[#0A5A84] hover:bg-blue-100`}
              >
                <Calendar className="h-3.5 w-3.5" />
                Đổi lịch
              </button>
            </>
          )}
          {isCompleted && appt.consultationId && (
            <>
              <button
                type="button"
                onClick={() => onMedicalRecord(appt)}
                className={`${BUTTON_CLASS} w-full border border-blue-200 bg-white text-[#0A5A84] hover:bg-blue-50`}
              >
                <FileText className="h-3.5 w-3.5" />
                Hồ sơ bệnh án
              </button>
              <button
                type="button"
                onClick={() => onReview(appt)}
                className={`${BUTTON_CLASS} w-full ${appt.hasReview ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : "bg-[#0A5A84] text-white hover:bg-[#08486B]"}`}
              >
                <Star className="h-3.5 w-3.5" />
                {appt.hasReview ? "Đã đánh giá" : "Đánh giá dịch vụ"}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => onDetail(appt)}
            className={`${BUTTON_CLASS} w-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}
          >
            <Eye className="h-3.5 w-3.5" />
            Xem chi tiết
          </button>
          {isUpcoming && (
            <button
              type="button"
              disabled={!isWithinCutoff}
              title={cancelLock}
              onClick={() => onCancel(appt)}
              className={`${BUTTON_CLASS} w-full bg-red-50 text-red-600 hover:bg-red-100`}
            >
              <X className="h-3.5 w-3.5" />
              Hủy lịch
            </button>
          )}
        </div>
      </div>

      {isCancelled && (
        <div className="mt-3 flex items-center gap-2 border-t border-red-100 pt-3 text-[11px] text-red-600">
          <X className="h-3.5 w-3.5" />
          Lịch hẹn đã được hủy theo yêu cầu.
        </div>
      )}
    </article>
  );
}
