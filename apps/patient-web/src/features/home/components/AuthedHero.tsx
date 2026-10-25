import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  CalendarCheck,
  PhoneCall,
  ShieldCheck,
} from "@/components/layout/icons";

const STATS = [
  { value: "120+", label: "Giáo sư & Bác sĩ CKII" },
  { value: "99.4%", label: "Bệnh nhân hài lòng" },
  { value: "24/7", label: "Trợ lý Y tế Trực tuyến" },
];

export default function AuthedHero() {
  return (
    <section className="bg-gradient-to-b from-[#EAF3FD] to-[#F6FAFE]">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-10 lg:grid-cols-[1.05fr_1fr] lg:py-14">
        {/* Trái */}
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-3.5 py-1.5 text-[11px] font-bold text-[#0A5A84]">
            <BadgeCheck className="h-3.5 w-3.5" />
            Bệnh viện Đạt Chuẩn Giám Định Y Khoa Quốc Tế JCI
          </span>

          <h1 className="mt-5 text-4xl font-extrabold leading-[1.15] text-slate-900 md:text-5xl">
            Chăm sóc y tế <span className="text-[#0A5A84]">toàn diện</span> &amp;
            công nghệ chẩn đoán dẫn đầu
          </h1>

          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-slate-600">
            MediConnect tiên phong áp dụng hệ thống Bệnh án điện tử thông minh EMR
            cùng nền tảng y tế số, mang lại quy trình đặt khám không chờ đợi và
            kết nối chuyên gia đầu ngành 24/7.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/dat-lich"
              className="inline-flex items-center gap-2 rounded-full bg-[#0A5A84] px-6 py-3.5 text-sm font-bold text-white shadow transition hover:bg-[#08486B]"
            >
              <CalendarCheck className="h-4 w-4" />
              Đặt khám trực tuyến
            </Link>
            <a
              href="tel:1900986868"
              className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-6 py-3.5 text-sm font-bold text-[#0A5A84] transition hover:bg-blue-100"
            >
              <PhoneCall className="h-4 w-4" />
              Tư vấn qua Hotline
            </a>
          </div>

          <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-slate-200 pt-6">
            {STATS.map((s) => (
              <div key={s.label}>
                <dt className="text-2xl font-extrabold text-[#0A5A84] md:text-3xl">
                  {s.value}
                </dt>
                <dd className="mt-1 text-[11px] text-slate-500">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Phải */}
        <div className="relative">
          <div className="relative aspect-[4/3.4] overflow-hidden rounded-3xl shadow-[0_20px_50px_rgba(10,90,132,0.18)]">
            <Image
              src="/images/home/hero-authed.png"
              alt="Bác sĩ MediConnect tư vấn cho bệnh nhân"
              fill
              priority
              sizes="(min-width:1024px) 45vw, 100vw"
              className="object-cover"
            />
          </div>

          <div className="absolute inset-x-4 bottom-4 flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-3 shadow-xl backdrop-blur">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0A5A84] text-white">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span className="flex-1 leading-tight">
              <span className="block text-sm font-extrabold text-slate-900">
                Cấp cứu 1900 8896
              </span>
              <span className="block text-[11px] text-slate-500">
                Hỗ trợ xe cứu thương ICU trong 15 phút
              </span>
            </span>
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
          </div>
        </div>
      </div>
    </section>
  );
}