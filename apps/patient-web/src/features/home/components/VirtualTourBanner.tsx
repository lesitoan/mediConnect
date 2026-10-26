import Image from "next/image";
import Link from "next/link";
import { Compass, Vr } from "@/components/layout/icons";

export default function VirtualTourBanner() {
    return (
        <div className="relative overflow-hidden rounded-3xl bg-[#174A8F] shadow-lg">
            <Image
                src="/images/tour/virtual-tour.png"
                alt="Tham quan bệnh viện trực tuyến 360°"
                fill
                sizes="(min-width:1280px) 1216px, 100vw"
                className="object-cover object-right"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0E3A75]/95 via-[#174A8F]/80 to-[#174A8F]/20" />

            <div className="relative z-10 max-w-xl px-6 py-10 md:px-10 md:py-12">
                <span className="inline-flex items-center gap-1.5 rounded-md border border-white/40 bg-white/15 px-2.5 py-1 text-[11px] font-bold uppercase text-white backdrop-blur">
                    <Vr className="h-3.5 w-3.5" />
                    Trải nghiệm số
                </span>

                <h2 className="mt-4 text-2xl font-extrabold text-white md:text-3xl">
                    Tham Quan Bệnh Viện Trực Tuyến 360°
                </h2>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-white/90">
                    Trải nghiệm không gian sảnh đón tiếp hiện đại, phòng phẫu thuật vô
                    khuẩn áp lực dương và hệ thống phòng nội trú 5 sao ngay tại nhà.
                </p>

                <Link
                    href="/tham-quan-360"
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#174A8F] shadow transition hover:bg-blue-50"
                >
                    <Compass className="h-4 w-4" />
                    Bắt đầu khám phá
                </Link>
            </div>
        </div>
    );
}