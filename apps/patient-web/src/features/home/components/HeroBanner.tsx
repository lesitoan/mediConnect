"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
    ArrowRight,
    CalendarCheck,
    ChevronLeft,
    ChevronRight,
    ShieldCheck,
} from "@/components/layout/icons";
import HeroInfoBar from "./HeroInfoBar";

const HERO_IMAGE = "/images/hero/hero-doctors.png";
const AUTOPLAY_MS = 6000;

type Slide = {
    badge: string;
    title: string;
    description: string;
};

const SLIDES: Slide[] = [
    {
        badge: "Bệnh viện đa khoa tiêu chuẩn quốc tế",
        title: "MediConnect - Khẳng Định Uy Tín Y Khoa Hàng Đầu",
        description:
            "Đồng hành cùng đội ngũ bác sĩ tài năng, trang thiết bị đồng bộ hiện đại và hệ sinh thái khám chữa bệnh chuẩn mực quốc tế.",
    },
    {
        badge: "Đặt lịch nhanh chóng",
        title: "Đặt Lịch Khám Trực Tuyến Chỉ Trong 3 Phút",
        description:
            "Chọn chuyên khoa, bác sĩ và khung giờ phù hợp. Nhận xác nhận ngay và theo dõi hàng chờ khám theo thời gian thực.",
    },
    {
        badge: "Hồ sơ sức khỏe tập trung",
        title: "Quản Lý Hồ Sơ Bệnh Án Mọi Lúc Mọi Nơi",
        description:
            "Xem lại lịch sử khám, đơn thuốc, thanh toán trực tuyến và nhận thông báo tự động ngay trên một nền tảng duy nhất.",
    },
];

export default function HeroBanner() {
    const [current, setCurrent] = useState(0);
    const [paused, setPaused] = useState(false);

    const next = useCallback(
        () => setCurrent((i) => (i + 1) % SLIDES.length),
        [],
    );
    const prev = useCallback(
        () => setCurrent((i) => (i - 1 + SLIDES.length) % SLIDES.length),
        [],
    );

    useEffect(() => {
        if (paused) return;
        const id = setInterval(next, AUTOPLAY_MS);
        return () => clearInterval(id);
    }, [paused, next]);

    const slide = SLIDES[current];

    return (
        <section
            className="relative flex min-h-[640px] flex-col overflow-hidden bg-[#174A8F] md:min-h-[680px]"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            {/* Background */}
            <Image
                src={HERO_IMAGE}
                alt="Đội ngũ bác sĩ MediConnect"
                fill
                priority
                sizes="100vw"
                className="object-cover object-[65%_center]"
            />
            {/* Overlay xanh + gradient để chữ dễ đọc */}
            <div className="absolute inset-0 bg-[#174A8F]/55" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0E3A75]/90 via-[#174A8F]/40 to-transparent" />

            {/* Nội dung */}
            <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center px-4 pb-6 pt-12">
                <div key={current} className="max-w-xl animate-[heroFade_0.6s_ease-out]">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {slide.badge}
                    </span>

                    <h1 className="mt-5 text-4xl font-extrabold leading-tight text-white md:text-5xl">
                        {slide.title}
                    </h1>

                    <p className="mt-5 max-w-md text-base leading-relaxed text-white/90">
                        {slide.description}
                    </p>

                    <div className="mt-8 flex flex-wrap gap-3">
                        <Link
                            href="/dat-lich"
                            className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-[#174A8F] shadow transition hover:bg-blue-50"
                        >
                            <CalendarCheck className="h-4 w-4" />
                            Đặt lịch khám ngay
                        </Link>
                        <Link
                            href="/chuyen-khoa"
                            className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
                        >
                            Khám phá chuyên khoa
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Nút prev / next */}
            <button
                type="button"
                aria-label="Slide trước"
                onClick={prev}
                className="absolute left-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur transition hover:bg-black/50 md:flex"
            >
                <ChevronLeft className="h-5 w-5" />
            </button>
            <button
                type="button"
                aria-label="Slide sau"
                onClick={next}
                className="absolute right-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur transition hover:bg-black/50 md:flex"
            >
                <ChevronRight className="h-5 w-5" />
            </button>

            {/* Dots */}
            <div className="relative z-10 mb-4 flex items-center justify-center gap-2">
                {SLIDES.map((_, i) => (
                    <button
                        key={i}
                        type="button"
                        aria-label={`Chuyển đến slide ${i + 1}`}
                        onClick={() => setCurrent(i)}
                        className={`h-1.5 rounded-full transition-all ${i === current ? "w-8 bg-white" : "w-1.5 bg-white/50"
                            }`}
                    />
                ))}
            </div>

            {/* Info bar */}
            <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-6">
                <HeroInfoBar />
            </div>
        </section>
    );
}