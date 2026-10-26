"use client";

import Link from "next/link";
import { ChevronRight, Home, Star } from "@/components/layout/icons";
import { useAuth } from "@/features/auth/useAuth";
import { getVisit } from "../data";
import ReviewForm from "./ReviewForm";
import VisitSummaryCard from "./VisitSummaryCard";

function Notice({
  title,
  desc,
  href,
  cta,
}: {
  title: string;
  desc: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="mx-auto max-w-lg rounded-2xl bg-white p-10 text-center shadow-[0_6px_24px_rgba(10,90,132,0.08)]">
      <h1 className="text-xl font-extrabold text-slate-900">{title}</h1>
      <p className="mt-3 text-sm text-slate-600">{desc}</p>
      <Link
        href={href}
        className="mt-6 inline-flex rounded-full bg-[#0A5A84] px-7 py-3 text-xs font-bold text-white transition hover:bg-[#08486B]"
      >
        {cta}
      </Link>
    </div>
  );
}

export default function ReviewPage({ code }: { code: string }) {
  const { user, ready } = useAuth();

  if (!ready) return <div className="min-h-[70vh]" aria-hidden="true" />;

  const visit = getVisit(code);

  let blocked: React.ReactNode = null;
  if (!user) {
    blocked = (
      <Notice
        title="Vui lòng đăng nhập"
        desc="Bạn cần đăng nhập tài khoản bệnh nhân để đánh giá phiên khám."
        href="/login"
        cta="Đăng nhập"
      />
    );
  } else if (!visit) {
    blocked = (
      <Notice
        title="Không tìm thấy phiên khám"
        desc="Phiên khám không tồn tại hoặc không thuộc tài khoản của bạn."
        href="/lich-su-lich-hen"
        cta="Về Lịch sử khám"
      />
    );
  } else if (visit.status !== "completed") {
    blocked = (
      <Notice
        title="Chưa thể đánh giá"
        desc="Chỉ những phiên khám đã hoàn tất mới được đánh giá."
        href="/lich-su-lich-hen"
        cta="Về Lịch sử khám"
      />
    );
  } else if (visit.alreadyReviewed) {
    blocked = (
      <Notice
        title="Phiên khám đã được đánh giá"
        desc="Mỗi phiên khám chỉ được đánh giá một lần."
        href="/lich-su-lich-hen"
        cta="Về Lịch sử khám"
      />
    );
  }

  return (
    <section className="bg-gradient-to-b from-[#EAF3FD] to-[#F6FAFE] pb-14">
      <div className="mx-auto max-w-7xl px-4">
        <nav aria-label="Breadcrumb" className="pt-5 text-xs text-slate-500">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="flex items-center gap-1 hover:text-[#0A5A84]">
                <Home className="h-3.5 w-3.5" />
                Trang chủ
              </Link>
            </li>
            <ChevronRight className="h-3 w-3" />
            <li>
              <Link href="/lich-su-lich-hen" className="hover:text-[#0A5A84]">
                Lịch sử khám &amp; Đơn thuốc
              </Link>
            </li>
            <ChevronRight className="h-3 w-3" />
            <li className="font-bold text-[#0A5A84]">Đánh giá phiên khám</li>
          </ol>
        </nav>

        {blocked ? (
          <div className="py-16">{blocked}</div>
        ) : (
          visit && (
            <>
              <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-3 py-1 text-[10px] font-bold uppercase text-[#0A5A84]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#2B6CB0]" />
                    Hồ sơ phản hồi chất lượng lâm sàng
                  </span>
                  <h1 className="mt-3 text-3xl font-extrabold text-slate-900 md:text-4xl">
                    Đánh giá phiên khám bệnh
                  </h1>
                  <p className="mt-2 text-xs text-slate-500">
                    Ý kiến xác thực của bạn là cơ sở nâng chuẩn chăm sóc và đảm bảo quyền lợi điều
                    trị tối ưu.
                  </p>
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-[#0A5A84]">
                    <Star className="h-4 w-4" />
                  </span>
                  <span className="leading-tight">
                    <span className="block text-sm font-extrabold text-[#0A5A84]">+50 MEDIPOINT</span>
                    <span className="block text-[10px] text-slate-500">
                      Thưởng ngay vào ví tích điểm
                    </span>
                  </span>
                </div>
              </div>

              <div className="mt-6 grid items-start gap-6 lg:grid-cols-[340px_1fr]">
                <aside className="lg:sticky lg:top-32">
                  <VisitSummaryCard visit={visit} />
                </aside>
                <ReviewForm visit={visit} />
              </div>
            </>
          )
        )}
      </div>
    </section>
  );
}