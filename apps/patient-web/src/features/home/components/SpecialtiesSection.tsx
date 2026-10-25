import Link from "next/link";
import type { ReactElement, SVGProps } from "react";
import {
    FlaskConical,
    Globe,
    HandPlus,
    HeartPulse,
    Lotus,
    PersonStanding,
    Stethoscope,
    Syringe,
} from "@/components/layout/icons";

type Service = {
    slug: string;
    title: string;
    description: string;
    icon: (p: SVGProps<SVGSVGElement>) => ReactElement;
    tone: "blue" | "teal";
};

const SERVICES: Service[] = [
    {
        slug: "kham-suc-khoe-tong-quat",
        title: "Khám sức khoẻ tổng quát",
        description:
            "Đánh giá sức khỏe toàn diện định kỳ cho cá nhân và đoàn thể doanh nghiệp.",
        icon: HeartPulse,
        tone: "blue",
    },
    {
        slug: "tam-soat-ung-thu-som",
        title: "Tầm soát ung thư sớm",
        description:
            "Ứng dụng máy chụp cắt lớp hiện đại nhằm phát hiện sớm các mầm bệnh nguy cơ cao.",
        icon: Stethoscope,
        tone: "teal",
    },
    {
        slug: "cham-soc-sac-dep-da-lieu",
        title: "Chăm sóc sắc đẹp & da liễu",
        description:
            "Công nghệ điều trị laser thẩm mỹ nội khoa hiện đại, an toàn và chuẩn y khoa.",
        icon: Lotus,
        tone: "blue",
    },
    {
        slug: "trung-tam-tiem-chung",
        title: "Trung tâm tiêm chủng vắc xin",
        description:
            "Vắc xin nhập khẩu chính hãng bảo quản theo tiêu chuẩn dây chuyền lạnh GSP quốc tế.",
        icon: Syringe,
        tone: "teal",
    },
    {
        slug: "vltl-phuc-hoi-chuc-nang",
        title: "VLTL & Phục hồi chức năng",
        description:
            "Phác đồ phục hồi chuyên sâu kết hợp vận động liệu pháp và y học cổ truyền.",
        icon: PersonStanding,
        tone: "blue",
    },
    {
        slug: "international-guest-service",
        title: "International Guest Service",
        description:
            "Dịch vụ y tế đặc biệt cho khách quốc tế với đội ngũ phiên dịch viên đa ngôn ngữ.",
        icon: Globe,
        tone: "teal",
    },
    {
        slug: "kham-theo-yeu-cau",
        title: "Dịch vụ khám theo yêu cầu",
        description:
            "Chủ động lựa chọn chuyên gia đầu ngành thăm khám tại khu vực VIP riêng tư.",
        icon: HandPlus,
        tone: "blue",
    },
    {
        slug: "quan-trac-moi-truong-y-te",
        title: "Quan trắc môi trường y tế",
        description:
            "Đo kiểm môi trường lao động, an toàn sinh học đạt chuẩn quy định Bộ Y Tế.",
        icon: FlaskConical,
        tone: "teal",
    },
];

const TONE_CLASS: Record<Service["tone"], string> = {
    blue: "bg-blue-50 text-[#174A8F]",
    teal: "bg-teal-50 text-[#0F5A7A]",
};

export default function SpecialtiesSection() {
    return (
        <section className="bg-[#F3F7FE] py-16">
            <div className="mx-auto max-w-7xl px-4">
                {/* Tiêu đề */}
                <div className="mx-auto max-w-2xl text-center">
                    <span className="inline-block rounded-full bg-blue-100/70 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#2B6CB0]">
                        Dịch vụ y tế tiêu chuẩn
                    </span>
                    <h2 className="mt-4 text-3xl font-extrabold text-slate-900 md:text-4xl">
                        Chuyên khoa &amp; Dịch vụ Y tế
                    </h2>
                    <p className="mt-4 text-[15px] leading-relaxed text-slate-600">
                        Hệ thống 22+ chuyên khoa với trang thiết bị y tế hiện đại, đội ngũ
                        bác sĩ chuyên môn cao phục vụ toàn diện sức khoẻ của bạn và gia
                        đình.
                    </p>
                </div>

                {/* Lưới dịch vụ */}
                <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {SERVICES.map(({ slug, title, description, icon: Icon, tone }) => (
                        <Link
                            key={slug}
                            href={`/chuyen-khoa/${slug}`}
                            className="group flex flex-col items-center rounded-2xl bg-white px-6 py-8 text-center shadow-[0_4px_20px_rgba(23,74,143,0.06)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(23,74,143,0.15)]"
                        >
                            <span
                                className={`flex h-16 w-16 items-center justify-center rounded-2xl transition group-hover:scale-105 ${TONE_CLASS[tone]}`}
                            >
                                <Icon className="h-7 w-7" />
                            </span>

                            <h3 className="mt-5 text-[15px] font-extrabold uppercase leading-snug text-slate-800 transition group-hover:text-[#174A8F]">
                                {title}
                            </h3>
                            <p className="mt-3 text-xs leading-relaxed text-slate-500">
                                {description}
                            </p>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}