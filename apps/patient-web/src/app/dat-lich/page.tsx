
import type { Metadata } from "next";

import { Calendar } from "@/components/layout/icons";
import PatientBreadcrumb from "@/components/layout/PatientBreadcrumb";
import BookingForm from "@/features/booking/components/BookingForm";

export const metadata: Metadata = {
  title: "Đặt lịch khám | MediConnect",
  description:
    "Đặt lịch khám trực tuyến tại MediConnect, lựa chọn chuyên khoa, bác sĩ và thời gian phù hợp.",
};

export default function BookingPage() {
  return (
    <main className="relative isolate min-h-screen overflow-clip bg-[#EAF4FE]">
      <PatientBreadcrumb currentPage="booking" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-40 top-12 h-[430px] w-[430px] rounded-full bg-[#D8ECFD]/70 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 top-0 h-[390px] w-[390px] rounded-full bg-[#D5EAFD]/80 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-1/3 h-[350px] w-[350px] rounded-full bg-[#DCEEFE]/60 blur-3xl"
        />

      <div className="relative z-10 w-full px-4 pb-16 pt-6 sm:px-6 lg:px-10 lg:pb-20 lg:pt-8 2xl:px-16">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#D6EBF7] bg-white text-[#08759A] shadow-[0_6px_20px_rgba(22,87,126,0.08)] sm:h-14 sm:w-14">
            <Calendar className="h-7 w-7" />
          </div>

          <div className="min-w-0">
            <h1 className="text-[27px] font-extrabold leading-tight tracking-tight text-[#102C53] sm:text-[32px]">
              Đặt lịch khám mới
            </h1>

            <p className="mt-1 text-[12px] leading-relaxed text-[#617287] sm:text-[14px]">
              Chọn chuyên khoa, bác sĩ và thời gian phù hợp cho buổi khám của bạn.
            </p>
          </div>
        </div>

        <BookingForm />
      </div>
    </main>
  );
}
