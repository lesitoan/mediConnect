"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { ArrowLeft, ArrowRight } from "@/components/layout/icons";

type FeaturedService = {
    slug: string;
    title: string;
    description: string;
    image: string;
    priceLabel: string;
    price: string;
};

const SERVICES: FeaturedService[] = [
    {
        slug: "goi-kham-tong-quat-nang-cao-nam",
        title: "Gói khám sức khỏe tổng quát nâng cao dành cho nam",
        description:
            "Gói khám sức khỏe tổng quát nâng cao tại MediConnect được thiết kế bởi hội đồng chuyên gia, phân tích sâu các chỉ số tim mạch, gan, thận và tầm soát nguy cơ.",
        image: "/images/services/kham-tong-quat-nam.png",
        priceLabel: "Chi phí trọn gói",
        price: "3.070.000 VNĐ",
    },
    {
        slug: "sinh-khong-dau",
        title: "Sinh không đau - Chuyển dạ an toàn và êm ái",
        description:
            "Ứng dụng kỹ thuật gây tê ngoài màng cứng hiện đại giúp mẹ bớt đau đớn, hồi phục nhanh, đảm bảo an toàn tuyệt đối cho bé và mẹ.",
        image: "/images/services/sinh-khong-dau.png",
        priceLabel: "Ưu đãi đồng hành",
        price: "2.000.000 VNĐ",
    },
    {
        slug: "tam-soat-som-ung-thu-vu",
        title: "Gói tầm soát sớm ung thư vú công nghệ cao",
        description:
            "Kết hợp chụp nhũ ảnh kỹ thuật số và siêu âm đàn hồi mô tuyến vú giúp phát hiện tổn thương vi thể ở giai đoạn sớm nhất.",
        image: "/images/services/tam-soat-ung-thu-vu.png",
        priceLabel: "Giá trọn gói",
        price: "1.402.080 VNĐ",
    },
    {
        slug: "tam-soat-ung-thu-co-tu-cung",
        title: "Gói tầm soát ung thư cổ tử cung chuyên sâu",
        description:
            "Xét nghiệm HPV định type kèm ThinPrep Pap test cho độ nhạy chẩn đoán cao, bảo vệ sức khỏe phụ nữ hiện đại.",
        image: "/images/services/tam-soat-ung-thu-co-tu-cung.png",
        priceLabel: "Giá trọn gói",
        price: "1.794.720 VNĐ",
    },
    {
        slug: "goi-kham-tong-quat-nu",
        title: "Gói khám sức khỏe tổng quát dành cho nữ",
        description:
            "Đánh giá toàn diện sức khỏe nữ giới: nội tiết, phụ khoa, tuyến giáp, xương khớp và các chỉ số chuyển hóa quan trọng.",
        image: "/images/services/goi-kham-nu.png",
        priceLabel: "Giá trọn gói",
        price: "2.650.000 VNĐ",
    },
    {
        slug: "goi-kham-tre-em",
        title: "Gói khám và theo dõi phát triển cho trẻ em",
        description:
            "Theo dõi tăng trưởng thể chất, dinh dưỡng và tầm soát sớm các vấn đề thường gặp ở trẻ do bác sĩ nhi khoa thực hiện.",
        image: "/images/services/goi-kham-tre-em.png",
        priceLabel: "Giá trọn gói",
        price: "1.250.000 VNĐ",
    },
];

export default function FeaturedServicesSection() {
    const trackRef = useRef<HTMLDivElement>(null);

    const scrollByPage = (dir: 1 | -1) => {
        const el = trackRef.current;
        if (!el) return;
        el.scrollBy({ left: dir * el.clientWidth, behavior: "smooth" });
    };

    return (
        <section className="bg-white py-16">
            <div className="mx-auto max-w-7xl px-4">
                {/* Tiêu đề + nút điều hướng */}
                <div className="flex items-end justify-between gap-4">
                    <div>
                        <span className="inline-block rounded-full bg-teal-100/80 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wide text-teal-800">
                            Dịch vụ nổi bật
                        </span>
                        <h2 className="mt-3 text-3xl font-extrabold text-slate-900 md:text-4xl">
                            Gói Dịch Vụ Y Tế Chuyên Sâu
                        </h2>
                        <p className="mt-2 text-[15px] text-slate-600">
                            Các gói khám và điều trị được thiết kế chuyên biệt, phù hợp với
                            nhu cầu sức khỏe của từng đối tượng.
                        </p>
                    </div>

                    <div className="hidden shrink-0 gap-2 sm:flex">
                        <button
                            type="button"
                            aria-label="Gói trước"
                            onClick={() => scrollByPage(-1)}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            aria-label="Gói sau"
                            onClick={() => scrollByPage(1)}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                        >
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Track */}
                <div
                    ref={trackRef}
                    className="mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                    {SERVICES.map((s) => (
                        <article
                            key={s.slug}
                            className="flex shrink-0 basis-full snap-start flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:shadow-[0_10px_30px_rgba(23,74,143,0.12)] sm:basis-[calc(50%-10px)] lg:basis-[calc(25%-15px)]"
                        >
                            <div className="relative h-[180px] w-full">
                                <Image
                                    src={s.image}
                                    alt={s.title}
                                    fill
                                    sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
                                    className="object-cover"
                                />
                                <span className="absolute left-3 top-3 rounded bg-emerald-500 px-2.5 py-1 text-[11px] font-bold uppercase text-white">
                                    Nổi bật
                                </span>
                            </div>

                            <div className="flex flex-1 flex-col px-5 pb-5 pt-5">
                                <h3 className="line-clamp-2 min-h-[2.75rem] text-base font-bold leading-snug text-slate-900">
                                    {s.title}
                                </h3>
                                <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-slate-500">
                                    {s.description}
                                </p>

                                <div className="mt-auto flex items-end justify-between gap-2 border-t border-slate-100 pt-4">
                                    <div>
                                        <p className="text-[11px] text-slate-400">{s.priceLabel}</p>
                                        <p className="text-lg font-extrabold text-[#2B6CB0]">
                                            {s.price}
                                        </p>
                                    </div>
                                    <Link
                                        href={`/dich-vu/${s.slug}`}
                                        className="flex items-center gap-1 whitespace-nowrap text-xs font-bold text-[#174A8F] transition hover:gap-2"
                                    >
                                        Xem chi tiết
                                        <ArrowRight className="h-3 w-3" />
                                    </Link>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>

                {/* CTA */}
                <div className="mt-10 flex justify-center">
                    <Link
                        href="/dich-vu"
                        className="inline-flex items-center gap-2 rounded-xl bg-[#2B6CB0] px-8 py-3.5 text-sm font-bold uppercase text-white shadow transition hover:bg-[#174A8F]"
                    >
                        Xem tất cả dịch vụ
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        </section>
    );
}