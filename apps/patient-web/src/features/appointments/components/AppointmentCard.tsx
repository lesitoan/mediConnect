"use client";

import Link from "next/link";
import {
  Calendar,
  Check,
  ClipboardList,
  Clock,
  Info,
  MapPin,
  QrCode,
  Star,
  Ticket,
  X,
} from "@/components/layout/icons";
import type { Appointment } from "../data";

const WEEKDAYS = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
const CUTOFF_HOURS = 2; // đổi/hủy tối thiểu 2 giờ trước giờ khám (theo SRS)
const pad = (n: number) => String(n).padStart(2, "0");

export function startOf(a: Appointment, now: Date) {
  const [h, m] = a.time.split(":").map(Number);
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + a.daysFromNow, h, m);
  return d;
}

type Props = {
  appt: Appointment;
  now: Date;
  onCancel: (a: Appointment) => void;
  onCheckin: (a: Appointment) => void;
};

export default function AppointmentCard({ appt, now, onCancel, onCheckin }: Props) {
  const start = startOf(appt, now);
  const h = start.getHours();
  const dateText = `${h < 12 ? "Sáng" : "Chiều"} ${WEEKDAYS[start.getDay()]}, ${pad(start.getDate())}/${pad(start.getMonth() + 1)}/${start.getFullYear()}`;
  const upcoming = appt.kind === "confirmed" || appt.kind === "followup";
  const canModify = upcoming && start.getTime() - now.getTime() >= CUTOFF_HOURS * 3600_000;
  const daysLeft = Math.max(0, Math.ceil((start.getTime() - now.getTime()) / 86_400_000));
  const lockTitle = canModify ? undefined : `Chỉ đổi/hủy được trước giờ khám tối thiểu ${CUTOFF_HOURS} giờ`;

  return (
    <article className="rounded-2xl bg-white p-5 shadow-[0_6px_24px_rgba(10,90,132,0.08)] ring-1 ring-slate-100 md:p-6">
      {/* Hàng trên */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex flex-wrap items-center gap-2.5">
          {appt.kind === "confirmed" && (
            <span className="flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 font-bold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              ĐÃ XÁC NHẬN • ĐÚNG HẸN
            </span>
          )}
          {appt.kind === "followup" && (
            <span className="flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1 font-bold text-[#0A5A84]">
              <Calendar className="h-3 w-3" />
              Lịch hẹn tái khám định kỳ
            </span>
          )}
          {appt.kind === "completed" && (
            <span className="flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 font-bold text-slate-600">
              <Check className="h-3 w-3" />
              ĐÃ HOÀN TẤT
            </span>
          )}
          {appt.kind === "cancelled" && (
            <span className="flex items-center gap-1.5 rounded-md bg-red-50 px-2.5 py-1 font-bold text-red-600">
              <X className="h-3 w-3" />
              ĐÃ HỦY
            </span>
          )}
          <span className="text-slate-500">
            Mã phiếu: <b className="text-slate-800">#{appt.code}</b>
          </span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-500">
            {appt.kind === "followup" ? "Toa ngày" : "Ngày đặt"}: <b className="text-slate-800">{appt.bookedAt}</b>
          </span>
        </div>

        {appt.queue && appt.kind === "confirmed" && (
          <span className="flex items-center gap-1.5 rounded-md border border-blue-100 bg-blue-50/70 px-2.5 py-1 font-bold text-[#0A5A84]">
            <Ticket className="h-3.5 w-3.5" />
            Số thứ tự: {appt.queue}
          </span>
        )}
        {appt.kind === "followup" && (
          <span className="rounded-md bg-slate-100 px-2.5 py-1 font-bold text-slate-600">
            Còn {daysLeft} ngày nữa
          </span>
        )}
      </div>

      {/* Thân thẻ */}
      <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_1.2fr_0.9fr]">
        {/* Bác sĩ */}
        <div className="flex items-center gap-4">
          <span className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2B6CB0] to-[#0A5A84] text-lg font-extrabold text-white">
            {appt.doctor.initials}
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[#2B6CB0] shadow">
              <Check className="h-3 w-3" />
            </span>
          </span>
          <div className="min-w-0 leading-tight">
            <span className="inline-block rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#0A5A84]">
              {appt.doctor.specialty}
            </span>
            <h3 className="mt-1.5 text-lg font-extrabold text-slate-900">{appt.doctor.name}</h3>
            <p className="mt-0.5 text-[11px] text-slate-500">{appt.doctor.title}</p>
            <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
              <Star className="h-3 w-3 text-amber-400" />
              <b className="text-slate-800">{appt.doctor.rating}</b> ({appt.doctor.reviews} đánh giá)
            </p>
          </div>
        </div>

        {/* Thời gian + phòng */}
        <div className="rounded-xl bg-blue-50/70 p-4">
          <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <Clock className="h-3.5 w-3.5 text-[#2B6CB0]" />
            {appt.kind === "followup" ? "Thời gian tái khám:" : "Thời gian khám:"}
          </p>
          <p className="mt-1 text-base font-extrabold text-[#0A5A84] md:text-lg">
            {pad(start.getHours())}:{pad(start.getMinutes())} - {dateText}
          </p>
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
            <MapPin className="h-3.5 w-3.5 text-[#2B6CB0]" />
            Phòng khám:
          </p>
          <p className="mt-0.5 text-sm font-bold text-slate-800">{appt.room}</p>
        </div>

        {/* Viện phí */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
          <p className="text-[11px] text-slate-500">{appt.feeLabel}</p>
          <p className="mt-1 text-2xl font-extrabold text-[#0A5A84]">
            {appt.fee} <span className="text-xs font-bold text-slate-500">VNĐ</span>
          </p>
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
            <Check className="h-3 w-3" />
            {appt.feeNote}
          </span>
        </div>
      </div>

      {/* Ghi chú */}
      {appt.note && upcoming && (
        <div
          className={`mt-4 flex items-start gap-2.5 rounded-xl px-4 py-3 text-xs ${
            appt.kind === "confirmed" ? "bg-blue-50 text-slate-700" : "bg-slate-100 text-slate-600"
          }`}
        >
          {appt.kind === "confirmed" ? (
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#2B6CB0]" />
          ) : (
            <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
          )}
          <p>
            <b>{appt.note.label}</b> {appt.note.text}
          </p>
        </div>
      )}

      {/* Hành động */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        {appt.kind === "confirmed" ? (
          <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <QrCode className="h-3.5 w-3.5" />
            SMS &amp; QR xác nhận gửi tới: <b className="text-slate-800">{appt.phone}</b>
          </p>
        ) : (
          <span />
        )}

        <div className="flex flex-wrap items-center gap-2">
          {upcoming ? (
            <>
              {appt.kind === "confirmed" ? (
                <button
                  type="button"
                  onClick={() => onCheckin(appt)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#0A5A84]/40 bg-white px-4 py-2 text-xs font-bold text-[#0A5A84] transition hover:bg-blue-50"
                >
                  <QrCode className="h-3.5 w-3.5" />
                  Mã QR Check-in
                </button>
              ) : (
                <Link
                  href={`/lich-su-lich-hen/${appt.code}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  <ClipboardList className="h-3.5 w-3.5" />
                  Xem chi tiết
                </Link>
              )}

              {canModify ? (
                <Link
                  href={`/dat-lich?reschedule=${appt.code}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-4 py-2 text-xs font-bold text-[#0A5A84] transition hover:bg-blue-200"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  {appt.kind === "confirmed" ? "Đổi lịch khám" : "Đổi lịch"}
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  title={lockTitle}
                  className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-400"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  Đổi lịch
                </button>
              )}

              <button
                type="button"
                disabled={!canModify}
                title={lockTitle}
                onClick={() => onCancel(appt)}
                className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                <X className="h-3.5 w-3.5" />
                Hủy lịch
              </button>
            </>
          ) : (
            <Link
              href={`/lich-su-lich-hen/${appt.code}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <ClipboardList className="h-3.5 w-3.5" />
              Xem chi tiết
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}