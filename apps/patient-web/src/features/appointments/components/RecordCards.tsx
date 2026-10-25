"use client";

import Link from "next/link";
import {
  Check,
  Clock,
  CreditCard,
  Download,
  FileText,
  FlaskConical,
  ImageIcon,
  Info,
  Paperclip,
  Pill,
  ShoppingBag,
  Star,
} from "@/components/layout/icons";
import { usePaidVisits } from "@/features/payment/paidStore";
import type { LabRecord, MedicalRecord, VisitRecord } from "../data";
import { cardFoot, cardHead, cardShell, panelBlue } from "./cardStyles";

const pillBtn =
  "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition";

function ActionButton({
  visitCode,
  reviewed,
  pending,
}: {
  visitCode: string;
  reviewed: boolean;
  pending: boolean;
}) {
  if (pending) {
    return (
      <Link
        href={`/lich-su-lich-hen/${visitCode}/thanh-toan`}
        className={`${pillBtn} bg-emerald-600 text-white hover:bg-emerald-700`}
      >
        <CreditCard className="h-3.5 w-3.5" />
        Thanh toán
      </Link>
    );
  }
  if (reviewed) {
    return (
      <span className={`${pillBtn} cursor-default bg-slate-100 text-slate-500`}>
        <Check className="h-3.5 w-3.5" />
        Đã đánh giá
      </span>
    );
  }
  return (
    <Link
      href={`/lich-su-lich-hen/${visitCode}/danh-gia`}
      className={`${pillBtn} bg-[#0A5A84] text-white hover:bg-[#08486B]`}
    >
      <Star className="h-3.5 w-3.5" />
      Đánh giá dịch vụ
    </Link>
  );
}

function PendingNote() {
  return (
    <p className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700">
      <Info className="h-3.5 w-3.5" />
      Vui lòng thanh toán viện phí để hoàn tất phiên khám
    </p>
  );
}

function Header({
  icon,
  title,
  badge,
  pending,
  meta,
  doctor,
  doctorLabel,
}: {
  icon: React.ReactNode;
  title: string;
  badge: string;
  pending: boolean;
  meta: React.ReactNode;
  doctor: { name: string; dept: string };
  doctorLabel: string;
}) {
  return (
    <div className={`flex flex-wrap items-start justify-between gap-3 ${cardHead}`}>
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[#0A5A84]">
          {pending ? <Clock className="h-5 w-5" /> : icon}
        </span>
        <div className="leading-tight">
          <h3 className="flex flex-wrap items-center gap-2 text-lg font-extrabold text-slate-900">
            {title}
            <span
              className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                pending ? "bg-amber-100 text-amber-800" : "bg-teal-100 text-teal-800"
              }`}
            >
              {pending ? "Chờ thanh toán" : badge}
            </span>
          </h3>
          <p className="mt-1 text-[11px] text-slate-500">{meta}</p>
        </div>
      </div>
      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-500">
        {doctorLabel}: <b className="text-[#0A5A84]">{doctor.name}</b> ({doctor.dept})
      </span>
    </div>
  );
}

function VisitCard({ r, pending }: { r: VisitRecord; pending: boolean }) {
  const rx = r.prescription;
  return (
    <article className={cardShell}>
      <Header
        icon={<Check className="h-5 w-5" />}
        title={r.title}
        badge="Hoàn tất"
        pending={pending}
        meta={
          <>
            Ngày khám: <b className="text-slate-700">{r.date}</b> • Bệnh án:{" "}
            <b className="text-[#0A5A84]">#{r.recordCode}</b>
          </>
        }
        doctor={r.doctor}
        doctorLabel="Bác sĩ"
      />

      {/* Kết luận */}
      <div
        className={`mt-4 flex flex-wrap items-start justify-between gap-3 ${panelBlue} px-4 py-3`}
      >
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-[#0A5A84]">
            <FileText className="h-3.5 w-3.5" />
            Kết luận lâm sàng:
          </p>
          <p className="mt-1.5 text-sm italic text-slate-700">&ldquo;{r.conclusion}&rdquo;</p>
        </div>
        <button
          type="button"
          // TODO: mở ảnh nội soi & kết quả cận lâm sàng (kiểm tra quyền xem)
          className={`${pillBtn} border border-slate-200 bg-white text-[#0A5A84] hover:bg-blue-50`}
        >
          <ImageIcon className="h-3.5 w-3.5" />
          Xem ảnh nội soi &amp; CLS
        </button>
      </div>

      {/* Đơn thuốc (nếu có) */}
      {rx && (
        <div className="mt-4 rounded-xl border border-slate-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="flex items-center gap-2 text-sm font-extrabold text-[#0A5A84]">
              <Pill className="h-4 w-4" />
              Đơn Thuốc Điện Tử Kèm Theo
              <span className="text-[11px] font-normal text-slate-500">
                (Mã đơn: <b className="text-slate-700">#{rx.code}</b>)
              </span>
            </h4>
            <button
              type="button"
              // TODO: mua lại thuốc theo toa (ngoài phạm vi SRS hiện tại)
              className={`${pillBtn} bg-sky-100 text-[#0A5A84] hover:bg-sky-200`}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Mua lại thuốc theo toa
            </button>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {rx.items.map((it) => (
              <div
                key={it.no}
                className="flex gap-3 rounded-lg border border-blue-100 bg-blue-50/70 p-3"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#2B6CB0] text-xs font-bold text-white">
                  {it.no}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-slate-900">{it.name}</p>
                    <span className="shrink-0 text-[11px] font-bold text-[#0A5A84]">
                      {it.qty}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">{it.dose}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <p className="flex items-center gap-1.5 text-slate-600">
              <Info className="h-3.5 w-3.5 text-[#2B6CB0]" />
              Lời dặn: {rx.advice}
            </p>
            <span className="italic text-slate-400">{rx.signature}</span>
          </div>
        </div>
      )}

      {/* Hành động */}
      <div className={`flex flex-wrap items-center justify-between gap-3 ${cardFoot}`}>
        {pending ? (
          <PendingNote />
        ) : r.adherence ? (
          <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <Check className="h-3.5 w-3.5 text-emerald-500" />
            {r.adherence}
          </p>
        ) : (
          <span />
        )}
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/ho-so-suc-khoe?record=${r.recordCode}`}
            className={`${pillBtn} border border-slate-200 bg-white text-[#0A5A84] hover:bg-blue-50`}
          >
            <FileText className="h-3.5 w-3.5" />
            Xem bệnh án EMR
          </Link>
          {rx && (
            <button
              type="button"
              // TODO: tải toa thuốc PDF
              className={`${pillBtn} bg-blue-100 text-[#0A5A84] hover:bg-blue-200`}
            >
              <Download className="h-3.5 w-3.5" />
              Tải toa thuốc (PDF)
            </button>
          )}
          <ActionButton visitCode={r.visitCode} reviewed={r.reviewed} pending={pending} />
        </div>
      </div>
    </article>
  );
}

function LabCard({ r, pending }: { r: LabRecord; pending: boolean }) {
  return (
    <article className={cardShell}>
      <Header
        icon={<FlaskConical className="h-5 w-5" />}
        title={r.title}
        badge="Hoàn tất kết quả"
        pending={pending}
        meta={
          <>
            Ngày khám: <b className="text-slate-700">{r.date}</b> • Mã hồ sơ:{" "}
            <b className="text-[#0A5A84]">#{r.resultCode}</b>
          </>
        }
        doctor={r.doctor}
        doctorLabel="Bác sĩ kết luận"
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {r.metrics.map((m) => (
          <div key={m.label} className={`${panelBlue} p-4`}>
            <p className="text-[11px] font-semibold text-slate-600">{m.label}</p>
            <p className="mt-1 text-xl font-extrabold text-slate-900">{m.value}</p>
            <p className="mt-0.5 text-[11px] font-semibold text-[#2B6CB0]">{m.note}</p>
          </div>
        ))}
      </div>

      <div className={`flex flex-wrap items-center justify-between gap-3 ${cardFoot}`}>
        {pending ? (
          <PendingNote />
        ) : (
          <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <Paperclip className="h-3.5 w-3.5" />
            {r.attachments}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/ho-so-suc-khoe?result=${r.resultCode}`}
            className={`${pillBtn} border border-slate-200 bg-white text-[#0A5A84] hover:bg-blue-50`}
          >
            <FileText className="h-3.5 w-3.5" />
            Xem hồ sơ xét nghiệm &amp; CDHA
          </Link>
          <button
            type="button"
            // TODO: tải gói kết quả (ZIP)
            className={`${pillBtn} border border-slate-200 bg-blue-50/70 text-[#0A5A84] hover:bg-blue-100`}
          >
            <Download className="h-3.5 w-3.5" />
            Tải kết quả (ZIP)
          </button>
          <ActionButton visitCode={r.visitCode} reviewed={r.reviewed} pending={pending} />
        </div>
      </div>
    </article>
  );
}

export default function RecordCard({ record }: { record: MedicalRecord }) {
  const paid = usePaidVisits();
  const pending = record.paymentStatus === "pending" && !paid.includes(record.visitCode);

  return record.type === "visit" ? (
    <VisitCard r={record} pending={pending} />
  ) : (
    <LabCard r={record} pending={pending} />
  );
}