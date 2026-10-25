import Image from "next/image";
import Link from "next/link";
import {
    Apple,
    Bell,
    CalendarCheck,
    PhoneCall,
    PlayStore,
} from "@/components/layout/icons";

export default function AppDownloadSection() {
    return (
        <section className="bg-white pb-16">
            <div className="mx-auto max-w-7xl px-4">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2B6CB0] via-[#1F5AA0] to-[#174A8F] px-6 py-10 shadow-lg md:px-12 md:py-14">
                    <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
                        {/* Trái: nội dung */}
                        <div>
                            <span className="inline-block rounded-md bg-white/20 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white">
                                Ứng dụng sức khỏe MediConnect
                            </span>

                            <h2 className="mt-4 max-w-xl text-3xl font-extrabold leading-tight text-white md:text-4xl">
                                Sẵn sàng chăm sóc sức khỏe của bạn &amp; gia đình?
                            </h2>
                            <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/90">
                                Đặt lịch khám ngay hôm nay. Đội ngũ bác sĩ chuyên khoa của chúng
                                tôi luôn sẵn sàng phục vụ bạn, hoặc Quét mã QR và cài đặt ngay
                                ứng dụng di động để tra cứu kết quả xét nghiệm, lịch hẹn và hồ
                                sơ sức khỏe trực tuyến 24/7.
                            </p>

                            <div className="mt-8 flex flex-wrap items-start gap-5">
                                {/* QR */}
                                <div className="rounded-xl bg-white p-2 text-center shadow-md">
                                    <div className="relative h-24 w-24 overflow-hidden rounded-lg">
                                        <Image
                                            src="/images/app/qr-app.png"
                                            alt="Mã QR tải ứng dụng MediConnect"
                                            fill
                                            sizes="96px"
                                            className="object-cover"
                                        />
                                    </div>
                                    <p className="mt-1.5 text-[10px] font-bold text-slate-700">
                                        Quét để tải App
                                    </p>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <div className="flex flex-wrap gap-3">
                                        <a
                                            href="#"
                                            className="flex items-center gap-2.5 rounded-xl border border-white/20 bg-[#0B1F3A] px-4 py-2.5 text-white transition hover:bg-black"
                                        >
                                            <Apple className="h-6 w-6" />
                                            <span className="leading-tight">
                                                <span className="block text-[9px] uppercase text-white/70">
                                                    Tải trên
                                                </span>
                                                <span className="block text-sm font-bold">
                                                    App Store
                                                </span>
                                            </span>
                                        </a>
                                        <a
                                            href="#"
                                            className="flex items-center gap-2.5 rounded-xl border border-white/20 bg-[#0B1F3A] px-4 py-2.5 text-white transition hover:bg-black"
                                        >
                                            <PlayStore className="h-6 w-6" />
                                            <span className="leading-tight">
                                                <span className="block text-[9px] uppercase text-white/70">
                                                    Tải trên
                                                </span>
                                                <span className="block text-sm font-bold">
                                                    Google Play
                                                </span>
                                            </span>
                                        </a>
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        <Link
                                            href="/dat-lich"
                                            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-xs font-bold text-[#174A8F] transition hover:bg-blue-50"
                                        >
                                            <CalendarCheck className="h-4 w-4" />
                                            Đặt lịch khám ngay
                                        </Link>
                                        <a
                                            href="tel:1900986868"
                                            className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/15 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/25"
                                        >
                                            <PhoneCall className="h-4 w-4" />
                                            Hotline 1900 986 868
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Phải: ảnh điện thoại */}
                        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
                            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl shadow-2xl ring-4 ring-white/20">
                                <Image
                                    src="/images/app/app-bg.png"
                                    alt="Ứng dụng MediConnect trên điện thoại"
                                    fill
                                    sizes="(min-width:1024px) 40vw, 100vw"
                                    className="object-cover"
                                />
                            </div>

                            {/* Thẻ nhắc lịch */}
                            <div className="absolute -bottom-5 left-4 flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-xl md:-left-6">
                                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                    <Bell className="h-4 w-4" />
                                </span>
                                <span className="leading-tight">
                                    <span className="block text-[9px] font-bold uppercase text-slate-400">
                                        Nhắc lịch tự động
                                    </span>
                                    <span className="block text-sm font-bold text-slate-900">
                                        Khám định kỳ đúng hẹn
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}