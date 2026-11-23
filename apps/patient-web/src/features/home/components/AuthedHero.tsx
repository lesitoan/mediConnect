
"use client";

import Image from "next/image";
import Link from "next/link";

import {
  ArrowRight,
  Award,
  BadgeCheck,
  Bot,
  CalendarCheck,
  Clock,
  FileText,
  History,
  PhoneCall,
  Users,
} from "@/components/layout/icons";
import { openAiChat } from "@/components/layout/aiChat";

const STATS = [
  {
    value: "120+",
    label: "Giáo sư & Bác sĩ CKII",
    icon: Users,
  },
  {
    value: "99.4%",
    label: "Bệnh nhân hài lòng",
    icon: Award,
  },
  {
    value: "24/7",
    label: "Trợ lý Y tế Trực tuyến",
    icon: Clock,
  },
];

const QUICK_ACTIONS = [
  {
    title: "Đặt lịch khám",
    description: "Chọn chuyên khoa, bác sĩ và thời gian phù hợp",
    href: "/dat-lich",
    icon: CalendarCheck,
  },
  {
    title: "Hồ sơ điện tử",
    description: "Quản lý thông tin cá nhân, bệnh án và kết quả khám",
    href: "/ho-so-suc-khoe",
    icon: FileText,
  },
  {
    title: "Trợ lý AI",
    description: "Hỗ trợ tư vấn, gợi ý chuyên khoa và giải đáp thắc mắc 24/7",
    href: null,
    icon: Bot,
  },
  {
    title: "Lịch sử khám / Lịch hẹn",
    description: "Xem lịch hẹn sắp tới và lịch sử khám chi tiết",
    href: "/lich-su-lich-hen",
    icon: History,
  },
];

function QuickActionCard({
  action,
}: {
  action: (typeof QUICK_ACTIONS)[number];
}) {
  const Icon = action.icon;

  const content = (
    <>
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#EAF5FC] text-[#086084] transition-colors duration-300 group-hover:bg-[#DDF0FB] sm:h-16 sm:w-16">
        <Icon className="h-7 w-7 sm:h-8 sm:w-8" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-extrabold leading-snug text-[#10213E] sm:text-base">
          {action.title}
        </span>

        <span className="mt-2 block text-[12px] leading-relaxed text-[#627184] sm:text-[13px]">
          {action.description}
        </span>
      </span>

      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F0F7FC] text-[#0A5A84] transition-all duration-300 group-hover:translate-x-1 group-hover:bg-[#DCEFFA]">
        <ArrowRight className="h-4 w-4" />
      </span>
    </>
  );

  const className =
    "group flex min-h-[142px] w-full items-start gap-4 rounded-[22px] border border-white bg-white px-5 py-6 text-left shadow-[0_8px_28px_rgba(20,73,112,0.055)] transition-all duration-300 hover:-translate-y-1 hover:border-[#D4EAF6] hover:shadow-[0_14px_35px_rgba(20,73,112,0.13)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A5A84] sm:min-h-[154px] sm:items-center";

  if (action.href) {
    return (
      <Link href={action.href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={openAiChat}
      className={className}
      aria-label="Mở trợ lý AI MediConnect"
    >
      {content}
    </button>
  );
}

export default function AuthedHero() {
  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-b from-[#EAF4FE] via-[#EAF5FF] to-[#E5F2FD]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-[290px] h-[460px] w-[460px] rounded-full bg-[#D3EAFD]/60 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-28 top-8 h-[360px] w-[360px] rounded-full bg-[#D5EAFC]/70 blur-3xl"
      />

      <div className="relative z-10 mx-auto w-full max-w-[1536px] px-5 pb-12 pt-12 sm:px-8 lg:px-12 lg:pb-16 lg:pt-14 2xl:px-14">
        <div className="grid items-center gap-10 lg:grid-cols-[1.03fr_1fr] lg:gap-12 xl:gap-16">
          <div className="min-w-0">
            <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#D8EAF6] bg-white/75 px-4 py-2 text-[12px] font-bold text-[#095678] shadow-[0_2px_10px_rgba(27,93,137,0.035)] sm:text-[13px]">
              <BadgeCheck className="h-4 w-4 shrink-0" />
              <span>Phòng khám đa chuyên khoa MediConnect</span>
            </div>

            <h1 className="mt-7 max-w-[710px] text-[34px] font-extrabold leading-[1.19] tracking-[-0.035em] text-[#0C1934] sm:text-[43px] lg:text-[44px] xl:text-[49px] 2xl:text-[52px]">
              Chăm sóc y tế{" "}
              <span className="text-[#086087]">toàn diện</span>
              {" "}&amp; công nghệ chẩn đoán dẫn đầu
            </h1>

            <p className="mt-5 max-w-[660px] text-[15px] leading-[1.8] text-[#526173] sm:text-[16px] lg:text-[16px]">
              MediConnect tiên phong áp dụng hệ thống Bệnh án điện tử
              thông minh EMR cùng nền tảng y tế số, mang lại quy
              trình đặt khám không chờ đợi và kết nối chuyên gia
              đầu ngành 24/7.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/dat-lich"
                className="inline-flex min-h-[52px] items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#0B7499] to-[#086181] px-7 py-3 text-[14px] font-bold text-white shadow-[0_6px_15px_rgba(8,94,132,0.17)] transition-all duration-200 hover:-translate-y-0.5 hover:from-[#075E82] hover:to-[#064D6D] hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A5A84]"
              >
                <CalendarCheck className="h-5 w-5" />
                Đặt lịch khám trực tuyến
              </Link>

              <a
                href="tel:1900986868"
                className="inline-flex min-h-[52px] items-center justify-center gap-3 rounded-full border border-[#DAEAF5] bg-white/80 px-7 py-3 text-[14px] font-bold text-[#075A7D] shadow-[0_3px_12px_rgba(10,90,132,0.035)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A5A84]"
              >
                <PhoneCall className="h-5 w-5" />
                Tư vấn qua Hotline
              </a>
            </div>

            <div className="mt-8 grid grid-cols-3 border-t border-[#CEDFEB] pt-6 sm:mt-9 sm:pt-7">
              {STATS.map((stat, index) => {
                const Icon = stat.icon;

                return (
                  <div
                    key={stat.label}
                    className={`min-w-0 ${
                      index > 0
                        ? "border-l border-[#C9DDEB] pl-3 sm:pl-6"
                        : "pr-3"
                    }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Icon className="h-5 w-5 shrink-0 text-[#076388] sm:h-7 sm:w-7" />

                      <span className="text-[24px] font-extrabold leading-none tracking-tight text-[#075678] sm:text-[30px] lg:text-[32px]">
                        {stat.value}
                      </span>
                    </div>

                    <p className="mt-2 pl-0 text-[10px] leading-snug text-[#5A687A] sm:text-[12px]">
                      {stat.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[700px] lg:mx-0">
            <div
              aria-hidden="true"
              className="absolute -right-8 -top-8 h-44 w-44 rounded-full bg-[#D5EBFB]/80"
            />

            <div className="relative aspect-[1.37/1] w-full overflow-hidden rounded-[30px] border border-white/80 bg-[#D9ECF2] shadow-[0_22px_55px_rgba(23,103,150,0.10)] sm:aspect-[1.46/1] lg:aspect-[1.30/1] xl:aspect-[1.42/1]">
              <Image
                src="/images/home/hero-authed.png"
                alt="Bác sĩ MediConnect tư vấn và trao đổi với bệnh nhân tại phòng khám"
                fill
                priority
                sizes="(min-width: 1536px) 670px, (min-width: 1024px) 48vw, 100vw"
                className="object-cover object-center"
              />
            </div>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4 lg:gap-4">
          {QUICK_ACTIONS.map((action) => (
            <QuickActionCard key={action.title} action={action} />
          ))}
        </div>
      </div>
    </section>
  );
}
