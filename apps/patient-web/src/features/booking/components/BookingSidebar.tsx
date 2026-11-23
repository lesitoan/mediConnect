
"use client";

import {
  Bot,
  PhoneCall,
} from "@/components/layout/icons";

import { openAiChat } from "@/components/layout/aiChat";

export default function BookingConsultCard() {
  return (
    <section className="rounded-[22px] border border-white bg-white p-5 shadow-[0_8px_30px_rgba(20,73,112,0.07)] sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF0F2] text-[#E2556B]">
          <PhoneCall className="h-5 w-5" />
        </span>

        <div className="min-w-0">
          <h3 className="text-[15px] font-extrabold text-[#10365C]">
            Tư vấn trực tiếp
          </h3>

          <p className="mt-1.5 text-[12px] leading-relaxed text-[#64748B]">
            Cần hỗ trợ chọn chuyên khoa, bác sĩ hoặc giải đáp
            về đặt lịch khám? Liên hệ ngay với chúng tôi.
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <a
          href="tel:1900986868"
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-[#E1EEF8] bg-[#F0F8FE] px-3 py-2.5 text-[12px] font-extrabold text-[#07658D] transition hover:bg-[#E3F3FC]"
        >
          <PhoneCall className="h-4 w-4 shrink-0" />
          1900 986 868
        </a>

        <button
          type="button"
          onClick={openAiChat}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-[#E1EEF8] bg-[#F0F8FE] px-3 py-2.5 text-[12px] font-extrabold text-[#07658D] transition hover:bg-[#E3F3FC] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#07658D]"
        >
          <Bot className="h-4 w-4 shrink-0" />
          Hỗ trợ trực tuyến
        </button>
      </div>
    </section>
  );
}
