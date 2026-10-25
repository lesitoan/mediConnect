"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, ChevronRight, Home, ShieldCheck } from "@/components/layout/icons";
import { useAuth } from "@/features/auth/useAuth";
import { fmt, getInvoice, totals } from "../data";
import { markPaid, usePaidVisits } from "../paidStore";
import { BillTable, DoctorPanel, HeaderCard, Settlement } from "./InvoiceParts";
import PaymentMethods, { type MethodKey } from "./PaymentMethods";

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

export default function PaymentPage({ code }: { code: string }) {
  const { user, ready } = useAuth();
  const paidList = usePaidVisits();

  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<null | "paid" | "counter">(null);

  if (!ready) return <div className="min-h-[70vh]" aria-hidden="true" />;

  const inv = getInvoice(code);
  const remaining = inv ? totals(inv).remaining : 0;

  const handlePay = async (method: MethodKey) => {
    if (!inv || paying) return;
    setPaying(true);
    setError("");
    try {
      // TODO: gọi API thanh toán (UC06 - Thanh toán):
      // - SePay QR: backend tạo/lấy hóa đơn + mã thanh toán duy nhất và trả mã QR; trạng thái
      //   "Đã thanh toán" chỉ cập nhật khi SePay gửi webhook (xác thực nguồn, chống xử lý trùng).
      // - Tại quầy: lễ tân tìm hóa đơn, nhận tiền và xác nhận số tiền đã thu.
      await new Promise((r) => setTimeout(r, 800));
      if (method === "counter") {
        setDone("counter");
      } else {
        markPaid(inv.code); // chỉ để demo
        setDone("paid");
      }
    } catch {
      setError("Không thể xử lý thanh toán lúc này. Vui lòng thử lại.");
    } finally {
      setPaying(false);
    }
  };

  let body: React.ReactNode;

  if (!user) {
    body = (
      <Notice
        title="Vui lòng đăng nhập"
        desc="Bạn cần đăng nhập tài khoản bệnh nhân để thanh toán viện phí."
        href="/login"
        cta="Đăng nhập"
      />
    );
  } else if (!inv) {
    body = (
      <Notice
        title="Không tìm thấy hóa đơn"
        desc="Phiên khám không tồn tại hoặc không thuộc tài khoản của bạn."
        href="/lich-su-lich-hen"
        cta="Về Lịch sử khám"
      />
    );
  } else if (done) {
    body = (
      <div className="mx-auto max-w-lg rounded-2xl bg-white p-10 text-center shadow-[0_6px_24px_rgba(10,90,132,0.08)]">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <Check className="h-8 w-8" />
        </span>
        <h1 className="mt-5 text-2xl font-extrabold text-slate-900">
          {done === "paid" ? "Thanh toán thành công" : "Đã ghi nhận yêu cầu thanh toán tại quầy"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          {done === "paid" ? (
            <>
              Hóa đơn <b>#{inv.invoiceNo}</b> số tiền <b>{fmt(remaining)} VNĐ</b> đã được thanh
              toán. Hóa đơn điện tử sẽ được gửi qua email &amp; SMS.
            </>
          ) : (
            <>
              Vui lòng đến Quầy thu ngân tầng 1 (Tòa A) và đưa mã phiên <b>#{inv.code}</b>. Lễ tân
              sẽ xác nhận thu <b>{fmt(remaining)} VNĐ</b> và hệ thống cập nhật trạng thái hóa đơn.
            </>
          )}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/lich-su-lich-hen"
            className="rounded-full bg-[#0A5A84] px-6 py-3 text-xs font-bold text-white transition hover:bg-[#08486B]"
          >
            Về Lịch sử khám
          </Link>
          {done === "paid" && (
            <Link
              href={`/lich-su-lich-hen/${inv.code}/danh-gia`}
              className="rounded-full bg-blue-50 px-6 py-3 text-xs font-bold text-[#0A5A84] transition hover:bg-blue-100"
            >
              Đánh giá dịch vụ
            </Link>
          )}
        </div>
      </div>
    );
  } else if (!inv.basePending || paidList.includes(inv.code)) {
    body = (
      <Notice
        title="Hóa đơn đã được thanh toán"
        desc="Phiên khám này không còn khoản viện phí cần thanh toán."
        href="/lich-su-lich-hen"
        cta="Về Lịch sử khám"
      />
    );
  } else {
    body = (
      <div className="space-y-6">
        <HeaderCard inv={inv} />
        <div className="grid items-start gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="lg:sticky lg:top-32">
            <DoctorPanel inv={inv} />
          </aside>
          <div className="space-y-6">
            <BillTable inv={inv} />
            <Settlement inv={inv} />
            <PaymentMethods
              code={inv.code}
              remaining={remaining}
              paying={paying}
              error={error}
              onPay={handlePay}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="bg-gradient-to-b from-[#EAF3FD] to-[#F6FAFE] pb-14">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-5 pt-5 text-xs text-slate-500">
          <nav aria-label="Breadcrumb">
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
              <li className="font-bold text-[#0A5A84]">Thanh toán phiên khám</li>
            </ol>
          </nav>
          <span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 font-semibold text-[#0A5A84]">
            <ShieldCheck className="h-3.5 w-3.5" />
            Mã hóa SSL 256-Bit • Cổng thanh toán Y tế Quốc gia bảo trợ
          </span>
        </div>

        {body}
      </div>
    </section>
  );
}