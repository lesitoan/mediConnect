import Image from "next/image";
import Link from "next/link";

type Expert = {
  slug: string;
  experience: string;
  name: string;
  role: string;
  image: string;
};

const EXPERTS: Expert[] = [
  {
    slug: "tran-nhat-nam",
    experience: "25+ năm kinh nghiệm",
    name: "PGS.TS Trần Nhật Nam",
    role: "Trưởng khoa Tim mạch",
    image: "/images/home/bs-tran-nhat-nam.png",
  },
  {
    slug: "hoang-thao-chi",
    experience: "20+ năm kinh nghiệm",
    name: "TS.BS Hoàng Thảo Chi",
    role: "Phó khoa Nội Tiêu Hóa",
    image: "/images/home/bs-hoang-thao-chi.png",
  },
  {
    slug: "do-viet-minh",
    experience: "18+ năm kinh nghiệm",
    name: "BSCKII Đỗ Viết Minh",
    role: "Chuyên gia Can thiệp Thần kinh",
    image: "/images/home/bs-do-viet-minh.png",
  },
];

export default function AuthedExperts() {
  return (
    <section className="bg-[#EAF3FD] py-12">
      <div className="mx-auto max-w-7xl px-4">
        <p className="text-[10px] font-bold uppercase tracking-wide text-[#0A5A84]">
          Đội ngũ y tế danh tiếng
        </p>
        <h2 className="mt-1.5 text-3xl font-extrabold text-slate-900 md:text-4xl">
          Chuyên gia cố vấn chuyên môn hàng đầu
        </h2>

        <div className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {EXPERTS.map((e) => (
            <Link
              key={e.slug}
              href={`/dat-lich?doctor=${e.slug}`}
              className="group flex items-center gap-4 rounded-2xl bg-white p-3 shadow-[0_4px_20px_rgba(10,90,132,0.06)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(10,90,132,0.14)]"
            >
              <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full ring-2 ring-white">
                <Image
                  src={e.image}
                  alt={e.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </span>
              <span className="leading-tight">
                <span className="block text-[11px] font-bold text-[#0A5A84]">
                  {e.experience}
                </span>
                <span className="mt-1 block text-lg font-bold text-slate-900 transition group-hover:text-[#0A5A84]">
                  {e.name}
                </span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  {e.role}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}