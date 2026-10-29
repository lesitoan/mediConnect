import { Clock, PhoneCall } from "@/components/layout/icons";

export default function BookingConsultCard() {
    return (
        <div className="rounded-3xl bg-white p-6 shadow-[0_6px_24px_rgba(23,74,143,0.08)]">
            <h3 className="flex items-center gap-2 text-sm font-extrabold uppercase text-[#174A8F]">
                <PhoneCall className="h-4 w-4 text-rose-500" />
                Tư vấn trực tiếp
            </h3>

            <a
                href="tel:1900986868"
                className="mt-4 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3 transition hover:bg-emerald-50"
            >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white">
                    <PhoneCall className="h-5 w-5" />
                </span>
                <span className="leading-tight">
                    <span className="block text-[10px] font-bold uppercase text-slate-500">
                        Hotline 24/7
                    </span>
                    <span className="block text-lg font-extrabold text-[#0F5A7A]">
                        1900 986 868
                    </span>
                </span>
            </a>

            <a
                href="https://zalo.me/"
                target="_blank"
                rel="noreferrer"
                className="mt-3 flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-3 transition hover:bg-blue-50"
            >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-extrabold text-white">
                    Z
                </span>
                <span className="leading-tight">
                    <span className="block text-[10px] font-bold uppercase text-slate-500">
                        Chat Zalo
                    </span>
                    <span className="block text-sm font-extrabold text-[#174A8F]">
                        @mediconnect
                    </span>
                </span>
            </a>

            <div className="mt-3 rounded-2xl bg-slate-50 p-4 text-center">
                <p className="flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase text-slate-500">
                    <Clock className="h-3 w-3" />
                    Giờ làm việc
                </p>
                <p className="mt-1 text-sm font-extrabold text-slate-800">
                    T2-CN: 8:00-18:00
                </p>
                <p className="mt-0.5 text-xs font-bold text-red-600">Cấp cứu: 24/7</p>
            </div>
        </div>
    );
}
