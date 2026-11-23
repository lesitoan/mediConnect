import Link from "next/link";
import {
  Activity,
  Building,
  Calendar,
  Check,
  ClipboardList,
  FileText,
  FlaskConical,
  Pill,
  Receipt,
  Stethoscope,
  Wallet,
} from "@/components/layout/icons";
import { fmt, totals, type Invoice, type ItemIcon } from "../data";

const ITEM_ICON = {
  visit: Stethoscope,
  endoscopy: Activity,
  lab: FlaskConical,
  drug: Pill,
} as const satisfies Record<ItemIcon, unknown>;

const card = "rounded-2xl bg-white p-6 shadow-[0_6px_24px_rgba(10,90,132,0.08)]";

/* ---------- Cột trái ---------- */

export function DoctorPanel({ inv }: { inv: Invoice }) {
  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_6px_24px_rgba(10,90,132,0.08)]">
        <div className="h-1.5 bg-gradient-to-r from-[#0A5A84] to-[#2B6CB0]" />
        <div className="p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#2B6CB0] text-sm font-bold text-white">
              {inv.doctor.initials}
            </span>
            <span className="leading-tight">
              <span className="block text-[10px] font-bold uppercase text-[#2B6CB0]">
                Bác sĩ phụ trách
              </span>
              <span className="mt-0.5 block text-base font-extrabold text-slate-900">
                {inv.doctor.name}
              </span>
              <span className="block text-[11px] text-slate-500">{inv.doctor.dept}</span>
            </span>
          </div>

          <dl className="mt-4 space-y-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs">
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-1.5 text-slate-500">
                <Building className="h-3.5 w-3.5" />
                Địa điểm
              </dt>
              <dd className="font-bold text-slate-800">{inv.location}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-1.5 text-slate-500">
                <Calendar className="h-3.5 w-3.5" />
                Thời gian khám
              </dt>
              <dd className="text-right font-bold text-slate-800">{inv.time}</dd>
            </div>
          </dl>

          <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/70 p-3">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-[#0A5A84]">
              <ClipboardList className="h-3.5 w-3.5" />
              Chẩn đoán sau khám
            </p>
            <p className="mt-1.5 text-sm font-bold text-[#0A5A84]">{inv.diagnosis}</p>
            <p className="mt-1 text-[11px] text-slate-500">{inv.note}</p>
          </div>
        </div>
      </div>

      <div className={card}>
        <h3 className="flex items-center gap-2 text-base font-extrabold text-[#0A5A84]">
          <FileText className="h-4 w-4" />
          Hóa đơn điện tử
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-slate-600">
          Hóa đơn điện tử hợp lệ (e-Invoice) có chữ ký số sẽ được gửi tự động qua email &amp; SMS
          sau 15 phút kể từ khi hoàn tất thanh toán.
        </p>
        <p className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-[#0A5A84]">
          <Check className="h-3.5 w-3.5" />
          Đồng bộ tự động hồ sơ thuế &amp; ứng dụng VssID
        </p>
      </div>
    </div>
  );
}

/* ---------- Bảng kê ---------- */

export function BillTable({ inv }: { inv: Invoice }) {
  return (
    <section className={card}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
            <ClipboardList className="h-5 w-5 text-[#0A5A84]" />
            Bảng kê viện phí chi tiết theo dịch vụ
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Mức giá đã được kiểm toán tự động theo biểu phí Bộ Y Tế &amp; BHYT
          </p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-[#0A5A84]">
          {inv.items.length} hạng mục phát sinh
        </span>
      </div>

      <ul className="mt-5 space-y-3">
        {inv.items.map((it) => {
          const Ico = ITEM_ICON[it.icon];
          return (
            <li
              key={it.name}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-[#0A5A84]">
                  <Ico className="h-4 w-4" />
                </span>
                <span className="min-w-0 leading-tight">
                  <span className="block text-sm font-bold text-slate-900">{it.name}</span>
                  <span className="mt-0.5 block text-[11px] text-slate-500">{it.desc}</span>
                </span>
              </div>
              <div className="flex items-center gap-5">
                <div className="text-right text-[11px] leading-tight">
                  <p className="text-slate-500">Nguyên giá: {fmt(it.original)} đ</p>
                  <p className="mt-0.5 font-bold text-[#2B6CB0]">BHYT: -{fmt(it.bhyt)} đ</p>
                </div>
                <p className="w-28 text-right text-lg font-extrabold text-slate-900">
                  {fmt(it.original - it.bhyt)} <span className="text-xs font-bold">đ</span>
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ---------- Khấu trừ & quyết toán ---------- */

export function Settlement({ inv }: { inv: Invoice }) {
  const t = totals(inv);
  const stats = [
    { label: "Tổng chi phí thực tế", value: `${fmt(t.gross)} đ` },
    { label: "BHYT chi trả bảo trợ", value: `-${fmt(t.bhyt)} đ` },
    { label: "Tạm ứng trước khám", value: `-${fmt(t.advance)} đ` },
    { label: "Ưu đãi MediPoint (-50)", value: `-${fmt(t.points)} đ` },
  ];

  return (
    <section className="rounded-2xl bg-gradient-to-br from-blue-50 to-white p-6 shadow-[0_6px_24px_rgba(10,90,132,0.08)] ring-1 ring-blue-100">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-slate-900">Khấu trừ &amp; Quyết toán tài chính</h2>
        <Wallet className="h-5 w-5 text-[#0A5A84]" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-white p-4 ring-1 ring-slate-100">
            <p className="text-[11px] text-slate-500">{s.label}</p>
            <p className="mt-1 text-base font-extrabold text-[#0A5A84]">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-blue-100 pt-5">
        <p className="flex max-w-sm items-start gap-2.5 text-xs text-slate-600">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#2B6CB0] text-[#2B6CB0]">
            <Check className="h-3 w-3" />
          </span>
          Đã kiểm toán tự động theo định mức viện phí số #{inv.invoiceNo}
        </p>
        <div className="flex items-center gap-4">
          <p className="max-w-[140px] text-right text-[11px] font-bold uppercase leading-tight text-slate-700">
            Số tiền cần thanh toán còn lại:
          </p>
          <p className="text-3xl font-extrabold text-[#0A5A84] md:text-4xl">
            {fmt(t.remaining)} <span className="text-sm">VNĐ</span>
          </p>
        </div>
      </div>
    </section>
  );
}

export function HeaderCard({ inv }: { inv: Invoice }) {
  const t = totals(inv);
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-6 shadow-[0_6px_24px_rgba(10,90,132,0.08)]">
      <div>
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-sky-100 px-2.5 py-1 uppercase text-[#0A5A84]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2B6CB0]" />
            Chờ thanh toán viện phí
          </span>
          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-slate-600">
            Mã phiên: #{inv.code}
          </span>
        </div>
        <h1 className="mt-3 text-2xl font-extrabold text-slate-900 md:text-3xl">
          Thanh toán viện phí &amp; Chi phí dịch vụ
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right leading-tight">
          <p className="text-[11px] text-slate-500">Tổng dư nợ cần quyết toán</p>
          <p className="mt-1 text-3xl font-extrabold text-[#0A5A84] md:text-4xl">
            {fmt(t.remaining)} <span className="text-sm">VND</span>
          </p>
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#0A5A84]">
          <Receipt className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

export function BackLink() {
  return (
    <Link href="/lich-su-lich-hen" className="text-xs font-bold text-[#0A5A84] hover:underline">
      Về Lịch sử khám
    </Link>
  );
}