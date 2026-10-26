import Link from "next/link";
import type { ReactElement, SVGProps } from "react";
import {
  Activity,
  ArrowRight,
  Brain,
  HeartPulse,
  Smile,
} from "@/components/layout/icons";

type Item = {
  slug: string;
  title: string;
  description: string;
  icon: (p: SVGProps<SVGSVGElement>) => ReactElement;
  tone: string;
};

const ITEMS: Item[] = [
  {
    slug: "tim-mach-can-thiep",
    title: "Khoa Tim Mạch Can Thiệp",
    description:
      "Chẩn đoán và can thiệp tim mạch với hệ thống DSA phòng mổ Hybrid vô khuẩn tuyệt đối.",
    icon: HeartPulse,
    tone: "bg-blue-100 text-[#0A5A84]",
  },
  {
    slug: "than-kinh-so-nao",
    title: "Khoa Thần Kinh Sọ Não",
    description:
      "Điều trị chuyên sâu các bệnh lý đột quỵ, tai biến và phục hồi chức năng hệ vận động sớm.",
    icon: Brain,
    tone: "bg-sky-200 text-[#0A5A84]",
  },
  {
    slug: "tieu-hoa-gan-mat",
    title: "Tiêu Hóa & Gan Mật",
    description:
      "Nội soi không đau công nghệ AI NBI nhuộm màu mô giúp tầm soát ung thư sớm đường tiêu hóa.",
    icon: Activity,
    tone: "bg-teal-100 text-teal-800",
  },
  {
    slug: "nhi-tiem-chung",
    title: "Khoa Nhi & Tiêm Chủng",
    description:
      "Không gian khám thân thiện cho bé, cung cấp nguồn vaccine chính hãng lưu trữ chuẩn GSP.",
    icon: Smile,
    tone: "bg-indigo-100 text-indigo-700",
  },
];

export default function AuthedSpecialties() {
  return (
    <section className="bg-[#F6FAFE] py-12">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#0A5A84]">
              Dịch vụ lâm sàng mũi nhọn
            </p>
            <h2 className="mt-1.5 text-3xl font-extrabold text-slate-900 md:text-4xl">
              Chuyên khoa tiêu chuẩn Quốc tế
            </h2>
          </div>
          <Link
            href="/chuyen-khoa"
            className="hidden shrink-0 items-center gap-1.5 text-sm font-bold text-[#0A5A84] transition hover:gap-2.5 sm:inline-flex"
          >
            Xem toàn bộ 28 chuyên khoa
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ITEMS.map(({ slug, title, description, icon: Ico, tone }) => (
            <Link
              key={slug}
              href={`/chuyen-khoa/${slug}`}
              className="group rounded-2xl bg-white p-6 shadow-[0_4px_20px_rgba(10,90,132,0.06)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(10,90,132,0.14)]"
            >
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}
              >
                <Ico className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-lg font-bold text-slate-900 transition group-hover:text-[#0A5A84]">
                {title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-slate-500">
                {description}
              </p>
            </Link>
          ))}
        </div>

        <Link
          href="/chuyen-khoa"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-[#0A5A84] sm:hidden"
        >
          Xem toàn bộ 28 chuyên khoa
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}