import Link from "next/link";
import type { ReactElement, SVGProps } from "react";
import {
  Activity,
  Brain,
  Check,
  Ear,
  Eye,
  HeartPulse,
  PersonStanding,
  Smile,
  Sparkles,
  Stethoscope,
  Tooth,
  Users,
} from "@/components/layout/icons";
import type { IconKey, Specialty } from "../data";

type IconC = (p: SVGProps<SVGSVGElement>) => ReactElement;

const ICONS: Record<IconKey, { Ico: IconC; tone: string }> = {
  heart: { Ico: HeartPulse, tone: "bg-red-50 text-red-500" },
  digestive: { Ico: Activity, tone: "bg-sky-100 text-[#0A5A84]" },
  bone: { Ico: PersonStanding, tone: "bg-teal-100 text-teal-700" },
  ear: { Ico: Ear, tone: "bg-sky-100 text-[#0A5A84]" },
  eye: { Ico: Eye, tone: "bg-sky-100 text-[#0A5A84]" },
  tooth: { Ico: Tooth, tone: "bg-blue-100 text-[#0A5A84]" },
  brain: { Ico: Brain, tone: "bg-indigo-100 text-indigo-700" },
  child: { Ico: Smile, tone: "bg-amber-100 text-amber-700" },
  womb: { Ico: Sparkles, tone: "bg-pink-100 text-pink-600" },
};

export default function SpecialtyCard({ s }: { s: Specialty }) {
  const { Ico, tone } = ICONS[s.icon];

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_6px_24px_rgba(10,90,132,0.07)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(10,90,132,0.14)]">
      <div className="h-1.5 bg-[#0A5A84]" />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone}`}>
            <Ico className="h-5 w-5" />
          </span>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-[9px] font-bold text-[#0A5A84]">
            {s.badge}
          </span>
        </div>

        <h3 className="mt-4 text-lg font-extrabold leading-snug text-slate-900">{s.name}</h3>

        <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2.5">
          <Stethoscope className="mt-0.5 h-4 w-4 shrink-0 text-[#2B6CB0]" />
          <p className="text-[11px] leading-snug text-slate-600">
            Trưởng khoa: <b className="text-[#0A5A84]">{s.head.name}</b>
            <br />
            <span className="font-bold text-[#2B6CB0]">({s.head.years} năm kinh nghiệm)</span>
          </p>
        </div>

        <p className="mt-4 text-[10px] font-bold uppercase text-slate-500">Kỹ thuật mũi nhọn:</p>
        <ul className="mt-2 space-y-2">
          {s.techniques.map((t) => (
            <li key={t} className="flex items-start gap-2 text-[11px] leading-snug text-slate-600">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
              {t}
            </li>
          ))}
        </ul>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-4 text-[11px]">
          <span className="flex items-center gap-1.5 text-slate-500">
            <Users className="h-3.5 w-3.5" />
            {s.doctors} Bác sĩ chuyên khoa
          </span>
          <span className="flex items-center gap-1.5 font-bold text-[#2B6CB0]">
            <Check className="h-3.5 w-3.5" />
            {s.highlight}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <Link
            href={`/chuyen-khoa/${s.slug}`}
            className="rounded-lg border border-slate-200 bg-slate-50 py-2.5 text-center text-xs font-bold text-[#0A5A84] transition hover:bg-blue-50"
          >
            Xem chi tiết khoa
          </Link>
          <Link
            href={`/dat-lich?specialty=${s.slug}`}
            className="rounded-lg bg-[#0A5A84] py-2.5 text-center text-xs font-bold text-white transition hover:bg-[#08486B]"
          >
            Đặt lịch khám
          </Link>
        </div>
      </div>
    </article>
  );
}