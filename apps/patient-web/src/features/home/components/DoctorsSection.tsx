import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Award, Star } from "@/components/layout/icons";

type Doctor = {
    slug: string;
    name: string;
    title: string;
    specialty: string;
    experience: string;
    rating: number;
    image: string;
};

const DOCTORS: Doctor[] = [
    {
        slug: "hoang-thanh-tuyen",
        name: "Hoàng Thanh Tuyển",
        title: "Giám đốc, Thiếu tướng, PGS-TS",
        specialty: "Nội tiêu hóa",
        experience: "30+ năm",
        rating: 5.0,
        image: "/images/doctors/hoang-thanh-tuyen.png",
    },
    {
        slug: "tran-quang-phap",
        name: "Trần Quang Pháp",
        title: "PGĐ, Thượng tá, BSCKII",
        specialty: "Hồi sức cấp cứu",
        experience: "25+ năm",
        rating: 5.0,
        image: "/images/doctors/tran-quang-phap.png",
    },
    {
        slug: "truong-xuan-hung",
        name: "Trương Xuân Hùng",
        title: "PGĐ, Thượng tá, BSCKII",
        specialty: "Hồi sức tích cực",
        experience: "25+ năm",
        rating: 5.0,
        image: "/images/doctors/truong-xuan-hung.png",
    },
    {
        slug: "tran-nam-chung",
        name: "Trần Nam Chung",
        title: "PGĐ, Thượng tá, BSCKII",
        specialty: "Nội tim mạch",
        experience: "25+ năm",
        rating: 5.0,
        image: "/images/doctors/tran-nam-chung.png",
    },
];

function Stars({ value }: { value: number }) {
    return (
        <div className="flex items-center gap-0.5 text-amber-400">
            {Array.from({ length: 5 }).map((_, i) => (
                <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${i < Math.round(value) ? "" : "text-slate-200"}`}
                />
            ))}
        </div>
    );
}

export default function DoctorsSection() {
    return (
        <section className="bg-[#F3F7FE] py-16">
            <div className="mx-auto max-w-7xl px-4">
                {/* Tiêu đề */}
                <div className="mx-auto max-w-2xl text-center">
                    <span className="inline-block rounded-full bg-teal-100/80 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wide text-teal-800">
                        Đội ngũ bác sĩ chuyên gia
                    </span>
                    <h2 className="mt-4 text-3xl font-extrabold text-slate-900 md:text-4xl">
                        Chuyên Gia Y Tế Hàng Đầu
                    </h2>
                    <p className="mt-4 text-[15px] leading-relaxed text-slate-600">
                        Hơn 200 bác sĩ chuyên khoa với nhiều năm kinh nghiệm, được đào tạo
                        bài bản trong và ngoài nước, luôn tận tâm vì sức khỏe người bệnh.
                    </p>
                </div>

                {/* Lưới bác sĩ */}
                <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {DOCTORS.map((d) => (
                        <article
                            key={d.slug}
                            className="group overflow-hidden rounded-2xl bg-white shadow-[0_4px_20px_rgba(23,74,143,0.08)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(23,74,143,0.16)]"
                        >
                            <div className="relative aspect-[4/4.2] w-full overflow-hidden">
                                <Image
                                    src={d.image}
                                    alt={`${d.title} ${d.name}`}
                                    fill
                                    sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
                                    className="object-cover transition duration-300 group-hover:scale-105"
                                />
                                <span className="absolute bottom-3 left-3 rounded-full bg-[#174A8F]/90 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur">
                                    {d.specialty}
                                </span>
                                <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded bg-white/95 px-2 py-1 text-[11px] font-bold text-slate-700 shadow-sm">
                                    <Award className="h-3 w-3 text-amber-500" />
                                    {d.experience}
                                </span>
                            </div>

                            <div className="px-5 pb-5 pt-4 text-center">
                                <p className="text-[11px] font-bold uppercase tracking-wide text-[#2B6CB0]">
                                    {d.title}
                                </p>
                                <h3 className="mt-1 text-lg font-bold text-slate-900">
                                    {d.name}
                                </h3>

                                <div className="mt-2 flex items-center justify-center gap-2">
                                    <Stars value={d.rating} />
                                    <span className="text-xs font-semibold text-slate-500">
                                        {d.rating.toFixed(1)}
                                    </span>
                                </div>

                                <Link
                                    href={`/dat-lich?doctor=${d.slug}`}
                                    className="mt-4 block rounded-lg bg-blue-50 py-2.5 text-sm font-bold text-[#174A8F] transition hover:bg-[#174A8F] hover:text-white"
                                >
                                    Đặt lịch khám
                                </Link>
                            </div>
                        </article>
                    ))}
                </div>

                {/* CTA */}
                <div className="mt-10 flex justify-center">
                    <Link
                        href="/gioi-thieu/bac-si"
                        className="inline-flex items-center gap-2 rounded-xl bg-[#2B6CB0] px-8 py-3.5 text-sm font-bold uppercase text-white shadow transition hover:bg-[#174A8F]"
                    >
                        Xem tất cả bác sĩ
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        </section>
    );
}