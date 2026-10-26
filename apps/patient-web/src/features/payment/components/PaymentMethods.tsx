"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  Building,
  CreditCard,
  Lock,
  QrCode,
  Wallet,
  Zap,
} from "@/components/layout/icons";
import { fmt } from "../data";

export type MethodKey = "qr" | "atm" | "card" | "wallet" | "counter";

type Option = {
  key: MethodKey;
  title: string;
  desc: string;
  icon: (p: React.SVGProps<SVGSVGElement>) => React.ReactElement;
  badge?: string;
  tag?: string;
  chips?: string[];
};

const OPTIONS: Option[] = [
  {
    key: "qr",
    title: "Quét mã VietQR / VNPAY-QR",
    desc: "Hỗ trợ tất cả ứng dụng ngân hàng & ví điện tử, xử lý gạch nợ tức thì 3s.",
    icon: QrCode,
    badge: "KHUYÊN DÙNG",
  },
  {
    key: "atm",
    title: "Thẻ ATM / Internet Banking (NAPAS)",
    desc: "Kết nối hơn 42 ngân hàng nội địa Việt Nam qua cổng thanh toán bảo mật Napas.",
    icon: CreditCard,
    chips: ["Vietcombank", "BIDV", "Techcombank", "+39 khác"],
  },
  {
    key: "card",
    title: "Thẻ quốc tế Visa / MasterCard / JCB",
    desc: "Miễn phí phí giao dịch quốc tế, xác thực 3D-Secure tiêu chuẩn EMVCo.",
    icon: CreditCard,
    chips: ["VISA", "MasterCard", "JCB"],
  },
  {
    key: "wallet",
    title: "Ví điện tử MoMo / ZaloPay / Apple Pay",
    desc: "Chạm thanh toán một chạm nhanh chóng qua thiết bị di động đã liên kết.",
    icon: Wallet,
    chips: ["MoMo", "ZaloPay", "Apple Pay"],
  },
  {
    key: "counter",
    title: "Thanh toán trực tiếp tại Quầy thu ngân tầng 1 (Tòa A)",
    desc: "Hệ thống sẽ cấp ngay phiếu số thứ tự ưu tiên (Line VIP) trên ứng dụng.",
    icon: Building,
    tag: "Lấy số ưu tiên",
  },
];

type Props = {
  code: string;
  remaining: number;
  paying: boolean;
  error: string;
  onPay: (method: MethodKey) => void;
};

export default function PaymentMethods({ code, remaining, paying, error, onPay }: Props) {
  const [method, setMethod] = useState<MethodKey>("qr");

  const shortCode = `MDC${code.split("-").pop()}`;
  const transferNote = `${shortCode} ${Math.round(remaining / 1000)}K`;

  return (
    <>
      <section className="rounded-2xl bg-white p-6 shadow-[0_6px_24px_rgba(10,90,132,0.08)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-[#0A5A84]">Chọn phương thức thanh toán an toàn</h2>
            <p className="mt-1 text-xs text-slate-500">
              Lựa chọn giải pháp trực tuyến để được xử lý tự động ngay lập tức
            </p>
          </div>
          <Lock className="h-5 w-5 shrink-0 text-[#0A5A84]" />
        </div>

        <div role="radiogroup" aria-label="Phương thức thanh toán" className="mt-5 grid gap-3 md:grid-cols-2">
          {OPTIONS.map((o) => {
            const active = method === o.key;
            const Ico = o.icon;
            return (
              <button
                key={o.key}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setMethod(o.key)}
                className={`block rounded-xl border-2 p-4 text-left transition ${
                  o.key === "counter" ? "md:col-span-2" : ""
                } ${
                  active
                    ? "border-[#0A5A84] bg-blue-50/50"
                    : "border-slate-100 bg-slate-50/60 hover:border-blue-200"
                }`}
              >
                <span className="flex items-start gap-3">
                  <span
                    className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                      active ? "border-[#0A5A84]" : "border-slate-300"
                    }`}
                  >
                    {active && <span className="h-2 w-2 rounded-full bg-[#0A5A84]" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className="text-sm font-bold text-[#0A5A84]">{o.title}</span>
                      <span className="flex shrink-0 items-center gap-2">
                        {o.badge && (
                          <span className="rounded-full bg-[#0A5A84] px-2.5 py-1 text-[9px] font-bold text-white">
                            {o.badge}
                          </span>
                        )}
                        {o.tag && (
                          <span className="rounded-md bg-blue-100 px-2.5 py-1 text-[10px] font-bold text-[#0A5A84]">
                            {o.tag}
                          </span>
                        )}
                        <Ico className="h-5 w-5 text-[#0A5A84]" />
                      </span>
                    </span>
                    <span className="mt-1.5 block text-[11px] leading-relaxed text-slate-500">
                      {o.desc}
                    </span>

                    {o.chips && (
                      <span className="mt-3 flex flex-wrap gap-2">
                        {o.chips.map((c) => (
                          <span
                            key={c}
                            className="rounded-md bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600"
                          >
                            {c}
                          </span>
                        ))}
                      </span>
                    )}

                    {o.key === "qr" && active && (
                      <span className="mt-3 flex items-center gap-4 rounded-lg bg-white p-3 ring-1 ring-slate-100">
                        {/* TODO: thay bằng mã QR thật do SePay/backend tạo cho hóa đơn */}
                        <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-[#0A5A84]">
                          <QrCode className="h-12 w-12" />
                        </span>
                        <span className="text-[11px] leading-relaxed text-slate-600">
                          <span className="block font-bold text-slate-800">
                            Mã giao dịch động: {shortCode.replace("MDC", "MDC-")}
                          </span>
                          <span className="block">Nội dung tự động: {transferNote}</span>
                          <span className="mt-1 flex items-center gap-1 font-bold text-[#2B6CB0]">
                            <Zap className="h-3 w-3" />
                            Tự động đóng phiên khi chuyển khoản thành công
                          </span>
                        </span>
                      </span>
                    )}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-[0_6px_24px_rgba(10,90,132,0.08)]">
        {error && (
          <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/lich-su-lich-hen"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#0A5A84] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Xem chi tiết hồ sơ &amp; toa thuốc
          </Link>
          <button
            type="button"
            disabled={paying}
            onClick={() => onPay(method)}
            className="inline-flex items-center gap-2 rounded-full bg-[#2B6CB0] px-8 py-3.5 text-sm font-bold text-white shadow transition hover:bg-[#0A5A84] disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Lock className="h-4 w-4" />
            {paying
              ? "Đang xử lý..."
              : method === "counter"
                ? "Lấy số ưu tiên tại quầy"
                : `Xác nhận Thanh toán ${fmt(remaining)} VNĐ`}
          </button>
        </div>
      </section>
    </>
  );
}