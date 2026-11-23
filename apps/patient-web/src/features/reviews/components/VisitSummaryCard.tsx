import Link from "next/link";
import {
  Check,
  ChevronRight,
  Clock,
  MapPin,
  ShieldCheck,
  Stethoscope,
} from "@/components/layout/icons";
import type { Visit } from "../data";

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-white/70 px-3 py-2.5">
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-500">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-xs font-bold text-slate-800">{children}</p>
    </div>
  );
}

export default function VisitSummaryCard({ visit }: { visit: Visit }) {
  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_6px_24px_rgba(10,90,132,0.08)]">
        <div className="h-1.5 bg-gradient-to-r from-[#0A5A84] to-[#2B6CB0]" />
        <div className="p-5">
          <p className="text-[10px] font-bold uppercase text-slate-500">Mã phiếu khám</p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <h2 className="text-xl font-extrabold text-[#0A5A84]">#{visit.code}</h2>
            <span className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600">
              <Check className="h-3 w-3" />
              Hoàn tất ca khám
            </span>
          </div>

          <div className="mt-4 rounded-xl bg-blue-50/70 p-3">
            <div className="flex items-center gap-3">
              <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#2B6CB0] text-sm font-bold text-white">
                {visit.doctor.initials}
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white" />
              </span>
              <span className="leading-tight">
                <span className="inline-flex gap-1.5 text-[10px] font-bold">
                  <span className="rounded bg-[#0A5A84] px-1.5 py-0.5 text-white">Trưởng khoa</span>
                  <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[#0A5A84]">
                    {visit.doctor.specialty}
                  </span>
                </span>
                <span className="mt-1 block text-base font-extrabold text-slate-900">
                  {visit.doctor.name}
                </span>
                <span className="block text-[11px] text-slate-500">{visit.doctor.clinic}</span>
              </span>
            </div>

            <div className="mt-3 space-y-2">
              <Row icon={<Clock className="h-3 w-3" />} label="Thời gian thực hiện">
                {visit.time}
              </Row>
              <Row icon={<Stethoscope className="h-3 w-3" />} label="Chẩn đoán chuyên môn">
                {visit.diagnosis}
              </Row>
              <Row icon={<MapPin className="h-3 w-3" />} label="Vị trí phòng khám">
                {visit.room}
              </Row>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px]">
            <span className="flex items-center gap-1.5 text-slate-500">
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              Đã đồng bộ đơn thuốc điện tử
            </span>
            <Link
              href="/ho-so-suc-khoe"
              className="inline-flex items-center gap-0.5 font-bold text-[#0A5A84] hover:underline"
            >
              Xem hồ sơ
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-blue-50/80 p-5">
        <h3 className="flex items-center gap-2 text-sm font-extrabold text-[#0A5A84]">
          <ShieldCheck className="h-4 w-4" />
          Cam kết minh bạch lâm sàng
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-slate-600">
          Mọi nhận định được bảo vệ bởi Hội đồng Quản lý Chất lượng MediConnect theo chuẩn ISO
          9001:2015. Bác sĩ chỉ tiếp nhận phản hồi tổng kết để hoàn thiện công tác chuyên môn.
        </p>
      </div>
    </div>
  );
}