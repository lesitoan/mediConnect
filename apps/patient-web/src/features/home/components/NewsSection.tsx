"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
    ArrowRight,
    Calendar,
    ChevronRight,
    User,
} from "@/components/layout/icons";

type Group = "hospital" | "medical" | "digital";

type Article = {
    slug: string;
    group: Group;
    tag: string;
    title: string;
    excerpt: string;
    date: string;
    author: string;
    image: string;
};

const TABS: { key: Group; label: string }[] = [
    { key: "hospital", label: "Tin Bệnh Viện" },
    { key: "medical", label: "Y Học Thường Thức" },
    { key: "digital", label: "Chuyển Đổi Số Y Tế" },
];

const ARTICLES: Article[] = [
    // Tin bệnh viện
    {
        slug: "hoi-thao-ung-dung-tri-tue-nhan-tao",
        group: "hospital",
        tag: "Sự kiện nổi bật",
        title: "Hội thảo khoa học quốc tế về ứng dụng trí tuệ nhân tạo trong chẩn đoán hình ảnh can thiệp sớm",
        excerpt:
            "Sự kiện quy tụ hơn 150 chuyên gia đầu ngành trong nước và quốc tế chia sẻ các tiến bộ công nghệ mới nhất giúp giảm thiểu sai sót và nâng cao hiệu quả điều trị ung bướu.",
        date: "15/10/2024",
        author: "Ban Điều Tập MediConnect",
        image: "/images/news/hoi-thao-ai.png",
    },
    {
        slug: "tang-huyet-ap-lang-lam-viec",
        group: "hospital",
        tag: "Tim mạch",
        title: "Dấu hiệu tăng huyết áp thầm lặng người làm việc văn phòng không được bỏ qua",
        excerpt: "",
        date: "14/10/2024",
        author: "",
        image: "/images/news/tang-huyet-ap.png",
    },
    {
        slug: "bmi-che-do-an-dia-trung-hai",
        group: "hospital",
        tag: "Dinh dưỡng",
        title: "Cách kiểm soát chỉ số BMI và chế độ ăn Địa Trung Hải cho người tiểu đường",
        excerpt: "",
        date: "12/10/2024",
        author: "",
        image: "/images/news/bmi-dia-trung-hai.png",
    },
    {
        slug: "benh-an-dien-tu-emr",
        group: "hospital",
        tag: "Công nghệ",
        title: "Triển khai thành công hệ thống bệnh án điện tử EMR không giấy tờ trên toàn viện",
        excerpt: "",
        date: "10/10/2024",
        author: "",
        image: "/images/news/emr-dien-tu.png",
    },
    // Y học thường thức
    {
        slug: "dinh-duong-mua-lanh",
        group: "medical",
        tag: "Dinh dưỡng",
        title: "Chế độ dinh dưỡng giúp tăng đề kháng khi chuyển mùa",
        excerpt:
            "Những nhóm thực phẩm cần bổ sung và thói quen sinh hoạt đơn giản giúp cơ thể thích nghi tốt hơn với thời tiết thay đổi.",
        date: "08/10/2024",
        author: "Khoa Dinh dưỡng",
        image: "/images/news/dinh-duong-mua-lanh.png",
    },
    {
        slug: "giac-ngu-va-suc-khoe",
        group: "medical",
        tag: "Sức khỏe",
        title: "Thiếu ngủ kéo dài ảnh hưởng thế nào đến tim mạch và chuyển hóa",
        excerpt: "",
        date: "05/10/2024",
        author: "",
        image: "/images/news/giac-ngu.png",
    },
    // Chuyển đổi số
    {
        slug: "chuyen-doi-so-phong-kham",
        group: "digital",
        tag: "Công nghệ",
        title: "Đặt lịch và theo dõi hàng chờ khám theo thời gian thực trên nền tảng MediConnect",
        excerpt:
            "Bệnh nhân chủ động chọn bác sĩ, khung giờ, thanh toán trực tuyến và nhận thông báo tự động, giảm đáng kể thời gian chờ tại quầy.",
        date: "03/10/2024",
        author: "Ban Chuyển đổi số",
        image: "/images/news/chuyen-doi-so.png",
    },
    {
        slug: "ai-chan-doan-hinh-anh",
        group: "digital",
        tag: "AI",
        title: "Trợ lý AI hỗ trợ bệnh nhân tra cứu chuyên khoa và đặt lịch bằng hội thoại tự nhiên",
        excerpt: "",
        date: "01/10/2024",
        author: "",
        image: "/images/news/ai-chan-doan-hinh-anh.png",
    },
];

export default function NewsSection() {
    const [tab, setTab] = useState<Group>("hospital");

    const list = ARTICLES.filter((a) => a.group === tab);
    const [featured, ...others] = list;
    const side = others.slice(0, 3);

    return (
        <section className="bg-white py-16">
            <div className="mx-auto max-w-7xl px-4">
                {/* Tiêu đề + tab */}
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <span className="inline-block rounded-md bg-blue-100/70 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#2B6CB0]">
                            Truyền thông &amp; Y học
                        </span>
                        <h2 className="mt-3 text-3xl font-extrabold text-slate-900 md:text-4xl">
                            Tin Tức &amp; Cẩm Nang Y Khoa
                        </h2>
                    </div>

                    <div className="flex flex-wrap gap-2" role="tablist">
                        {TABS.map((t) => (
                            <button
                                key={t.key}
                                type="button"
                                role="tab"
                                aria-selected={tab === t.key}
                                onClick={() => setTab(t.key)}
                                className={`rounded-full border px-4 py-2 text-xs font-bold transition ${tab === t.key
                                    ? "border-[#2B6CB0] bg-[#2B6CB0] text-white"
                                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                    }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Nội dung */}
                {featured && (
                    <div className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
                        {/* Bài nổi bật */}
                        <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:shadow-[0_10px_30px_rgba(23,74,143,0.12)]">
                            <div className="relative aspect-[16/9] w-full overflow-hidden">
                                <Image
                                    src={featured.image}
                                    alt={featured.title}
                                    fill
                                    sizes="(min-width:1024px) 55vw, 100vw"
                                    className="object-cover transition duration-300 group-hover:scale-105"
                                />
                                <span className="absolute left-3 top-3 rounded bg-[#174A8F]/90 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
                                    {featured.tag}
                                </span>
                            </div>

                            <div className="p-6">
                                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5" />
                                        {featured.date}
                                    </span>
                                    {featured.author && (
                                        <span className="flex items-center gap-1.5">
                                            <User className="h-3.5 w-3.5" />
                                            {featured.author}
                                        </span>
                                    )}
                                </div>

                                <h3 className="mt-3 text-xl font-extrabold leading-snug text-slate-900">
                                    <Link
                                        href={`/tin-tuc/${featured.slug}`}
                                        className="transition hover:text-[#174A8F]"
                                    >
                                        {featured.title}
                                    </Link>
                                </h3>
                                {featured.excerpt && (
                                    <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-500">
                                        {featured.excerpt}
                                    </p>
                                )}

                                <Link
                                    href={`/tin-tuc/${featured.slug}`}
                                    className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#174A8F] transition hover:gap-2.5"
                                >
                                    Đọc toàn bộ bài viết
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                            </div>
                        </article>

                        {/* Danh sách bên phải */}
                        <div className="flex flex-col gap-4">
                            {side.map((a) => (
                                <Link
                                    key={a.slug}
                                    href={`/tin-tuc/${a.slug}`}
                                    className="group flex gap-4 rounded-2xl border border-slate-200 bg-white p-3 transition hover:shadow-[0_10px_30px_rgba(23,74,143,0.12)]"
                                >
                                    <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-xl">
                                        <Image
                                            src={a.image}
                                            alt={a.title}
                                            fill
                                            sizes="112px"
                                            className="object-cover transition duration-300 group-hover:scale-105"
                                        />
                                    </div>

                                    <div className="flex min-w-0 flex-1 flex-col justify-center">
                                        <p className="text-[11px] text-slate-400">
                                            <span className="font-bold uppercase text-[#2B6CB0]">
                                                {a.tag}
                                            </span>
                                            <span className="mx-1.5">•</span>
                                            {a.date}
                                        </p>
                                        <h4 className="mt-1 line-clamp-2 text-sm font-bold leading-snug text-slate-900 transition group-hover:text-[#174A8F]">
                                            {a.title}
                                        </h4>
                                        <span className="mt-1.5 inline-flex items-center gap-0.5 text-[11px] font-bold text-[#174A8F]">
                                            Chi tiết
                                            <ChevronRight className="h-3 w-3" />
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}