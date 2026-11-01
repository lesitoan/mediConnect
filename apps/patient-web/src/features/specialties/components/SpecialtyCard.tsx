import Link from "next/link";
import { Stethoscope } from "@/components/layout/icons";
import type { PublicDoctor } from "@/features/providers/services/providersService";
import type { PublicSpecialty } from "../services/specialtiesService";

export default function SpecialtyCard({
  specialty,
  doctors,
}: {
  specialty: PublicSpecialty;
  doctors: PublicDoctor[];
}) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_6px_24px_rgba(10,90,132,0.07)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(10,90,132,0.14)]">
      <div className="h-1.5 bg-[#0A5A84]" />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-[#0A5A84]">
            <Stethoscope className="h-5 w-5" />
          </span>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-[9px] font-bold text-[#0A5A84]">
            {specialty.code}
          </span>
        </div>

        <h3 className="mt-4 text-lg font-extrabold leading-snug text-slate-900">
          {specialty.name}
        </h3>

        <p className="mt-3 min-h-10 text-xs leading-relaxed text-slate-600">
          {specialty.description || "Thông tin giới thiệu chưa được cập nhật."}
        </p>

        <div className="mt-4 border-t border-slate-100 pt-4 text-[11px]">
          <p className="font-bold text-slate-700">
            Phòng khám: {specialty.roomCode}
          </p>
          <p className="mt-2 font-bold text-slate-700">
            Bác sĩ ({doctors.length})
          </p>
          {doctors.length > 0 ? (
            <ul className="mt-1 space-y-1 text-slate-600">
              {doctors.slice(0, 3).map((doctor) => (
                <li key={doctor.id}>{doctor.user.fullName}</li>
              ))}
              {doctors.length > 3 && (
                <li className="text-slate-500">
                  Và {doctors.length - 3} bác sĩ khác
                </li>
              )}
            </ul>
          ) : (
            <p className="mt-1 text-slate-500">Chưa có bác sĩ đang hoạt động.</p>
          )}
        </div>

        <div className="mt-auto pt-4">
          <Link
            href={`/dat-lich?specialty=${encodeURIComponent(specialty.id)}`}
            className="block rounded-lg bg-[#0A5A84] py-2.5 text-center text-xs font-bold text-white transition hover:bg-[#08486B]"
          >
            Đặt lịch khám
          </Link>
        </div>
      </div>
    </article>
  );
}