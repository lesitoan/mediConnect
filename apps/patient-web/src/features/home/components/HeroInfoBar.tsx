import Link from "next/link";
import { CalendarPlus, Clock, MapPin, PhoneCall } from "@/components/layout/icons";

function IconBox({ children }: { children: React.ReactNode }) {
    return (
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
            {children}
        </span>
    );
}

export default function HeroInfoBar() {
    return (
        <div className="rounded-2xl bg-gradient-to-r from-[#2B6CB0]/95 to-[#174A8F]/95 p-4 shadow-xl ring-1 ring-white/10 backdrop-blur md:px-8 md:py-5">
            <div className="grid gap-4 md:grid-cols-[1fr_1fr_1.1fr_auto] md:items-center md:gap-0">
                {/* Hotline */}
                <div className="flex items-center gap-3 md:pr-6">
                    <IconBox>
                        <PhoneCall className="h-6 w-6" />
                    </IconBox>
                    <div className="leading-tight text-white">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/80">
                            Hotline tư vấn
                        </p>
                        <a href="tel:1900986868" className="text-xl font-extrabold">
                            1900 986 868
                        </a>
                        <p className="text-[11px] text-white/80">
                            Cấp cứu 24/7: <b className="text-white">0236 3986881</b>
                        </p>
                    </div>
                </div>

                {/* Giờ làm việc */}
                <div className="flex items-center gap-3 md:border-l md:border-white/20 md:px-6">
                    <IconBox>
                        <Clock className="h-6 w-6" />
                    </IconBox>
                    <div className="leading-tight text-white">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/80">
                            Giờ làm việc
                        </p>
                        <p className="text-sm font-bold">Thứ 2 - Thứ 6: 7h00 - 18h00</p>
                        <p className="text-[11px] text-white/80">Thứ 7 - CN: Khám theo yêu cầu</p>
                    </div>
                </div>

                {/* Địa chỉ */}
                <div className="flex items-center gap-3 md:border-l md:border-white/20 md:px-6">
                    <IconBox>
                        <MapPin className="h-6 w-6" />
                    </IconBox>
                    <div className="leading-tight text-white">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/80">
                            Địa chỉ trụ sở
                        </p>
                        <p className="text-sm font-bold">216 Nguyễn Công Trứ</p>
                        <p className="text-[11px] text-white/80">An Hải Bắc, Sơn Trà, TP Đà Nẵng</p>
                    </div>
                </div>

                {/* CTA */}
                <Link
                    href="/dat-lich"
                    className="flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-extrabold uppercase text-[#174A8F] shadow transition hover:bg-blue-50 md:ml-4"
                >
                    <CalendarPlus className="h-5 w-5" />
                    Đặt lịch khám
                </Link>
            </div>
        </div>
    );
}