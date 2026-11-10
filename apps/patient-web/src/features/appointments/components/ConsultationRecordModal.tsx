"use client";

import { FileText, X } from "@/components/layout/icons";
import type { ConsultationMedicalRecord } from "@/features/medical-records/services/medicalRecordsService";

type Props = {
  record: ConsultationMedicalRecord | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
};

function formatDate(value: string | null) {
  if (!value) return "Chưa cập nhật";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(value));
}

export default function ConsultationRecordModal({ record, isLoading, error, onClose }: Props) {
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="consultation-record-title" className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 px-4 py-8">
      <div className="mx-auto max-w-4xl rounded-3xl bg-[#F6FAFE] p-4 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#2B6CB0]"><FileText className="h-4 w-4" />Hồ sơ bệnh án điện tử</p>
            <h2 id="consultation-record-title" className="mt-1 text-2xl font-extrabold text-slate-900">Chi tiết phiên khám</h2>
            <p className="mt-1 text-sm text-slate-500">Thông tin được khóa sau khi bác sĩ hoàn tất hồ sơ khám.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng hồ sơ bệnh án" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"><X className="h-5 w-5" /></button>
        </div>

        {isLoading ? <div className="mt-6 space-y-4"><div className="h-24 animate-pulse rounded-2xl bg-white" /><div className="h-48 animate-pulse rounded-2xl bg-white" /></div> : error ? <p role="alert" className="mt-6 rounded-2xl bg-red-50 p-5 text-sm font-semibold text-red-700">{error}</p> : record ? (
          <div className="mt-6 space-y-4">
            <section className="rounded-2xl border border-blue-100 bg-white p-5"><div className="grid gap-4 sm:grid-cols-2"><div><p className="text-xs font-semibold text-slate-500">Mã phiên khám</p><p className="mt-1 font-bold text-[#0A5A84]">#{record.appointment.appointmentCode}</p></div><div><p className="text-xs font-semibold text-slate-500">Ngày hoàn tất</p><p className="mt-1 font-bold text-slate-800">{formatDate(record.completedAt)}</p></div><div><p className="text-xs font-semibold text-slate-500">Bác sĩ</p><p className="mt-1 font-bold text-slate-800">{record.doctor.fullName}</p></div><div><p className="text-xs font-semibold text-slate-500">Chuyên khoa / phòng</p><p className="mt-1 font-bold text-slate-800">{record.specialty.name} · {record.room}</p></div></div></section>
            <section className="rounded-2xl border border-blue-100 bg-white p-5"><h3 className="text-base font-extrabold text-slate-900">Chẩn đoán</h3>{record.diagnoses.length ? <div className="mt-3 space-y-3">{record.diagnoses.map((diagnosis) => <div key={diagnosis.id} className="rounded-xl bg-blue-50/70 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-bold text-[#0A5A84]">{diagnosis.diagnosisName}{diagnosis.isPrimary && <span className="ml-2 rounded-full bg-emerald-100 px-2 py-1 text-[10px] text-emerald-700">Chẩn đoán chính</span>}</p>{diagnosis.diagnosisCode && <span className="text-xs font-semibold text-slate-500">{diagnosis.diagnosisCode}</span>}</div>{diagnosis.notes && <p className="mt-2 text-sm text-slate-600">{diagnosis.notes}</p>}</div>)}</div> : <p className="mt-3 text-sm text-slate-500">Chưa có thông tin chẩn đoán.</p>}</section>
            {(record.clinicalNotes || record.prescription || record.followUpDate) && <section className="rounded-2xl border border-blue-100 bg-white p-5"><h3 className="text-base font-extrabold text-slate-900">Kết luận và hướng xử trí</h3>{record.clinicalNotes && <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{record.clinicalNotes}</p>}{record.followUpDate && <p className="mt-3 text-sm font-semibold text-[#0A5A84]">Ngày tái khám: {formatDate(record.followUpDate)}</p>}{record.prescription && <p className="mt-3 text-sm text-slate-600">Đã có đơn thuốc điện tử trong hồ sơ khám.</p>}</section>}
          </div>
        ) : null}
      </div>
    </div>
  );
}
