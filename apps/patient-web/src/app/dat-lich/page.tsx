import type { Metadata } from "next";
import Link from "next/link";
import BookingForm from "@/features/booking/components/BookingForm";

export const metadata: Metadata = {
    title: "Đặt lịch khám | MediConnect",
};

export default function BookingPage() {
    return (
        <>
            <nav
                aria-label="Breadcrumb"
                className="border-b border-slate-100 bg-white"
            >
                <ol className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3 text-xs text-slate-500">
                    <li>
                        <Link href="/" className="transition hover:text-[#174A8F]">
                            Trang chủ
                        </Link>
                    </li>
                    <li aria-hidden="true">/</li>
                    <li className="font-bold text-slate-800">Đặt lịch khám</li>
                </ol>
            </nav>

            <section className="bg-[#EEF4FD] py-8 md:py-10">
                <div className="mx-auto max-w-7xl px-4">
                    <BookingForm />
                </div>
            </section>
        </>
    );
}