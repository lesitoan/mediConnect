"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Clock, ShieldCheck } from "@/components/layout/icons";

const OTP_LENGTH = 6;
const OTP_TTL_SECONDS = 5 * 60; // hiệu lực 5 phút
const RESEND_SECONDS = 60;
const MAX_ATTEMPTS = 5;

type Props = {
  phone: string;
  onBack: () => void;
  onSuccess: () => void;
};

const maskPhone = (p: string) =>
  p.length >= 7 ? `${p.slice(0, 3)}****${p.slice(-3)}` : p;

const mmss = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export default function OtpVerifyForm({ phone, onBack, onSuccess }: Props) {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ttl, setTtl] = useState(OTP_TTL_SECONDS);
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);
  const [attempts, setAttempts] = useState(0);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const code = digits.join("");
  const expired = ttl <= 0;
  const locked = attempts >= MAX_ATTEMPTS;

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  // Đếm ngược hiệu lực + thời gian chờ gửi lại
  useEffect(() => {
    const id = setInterval(() => {
      setTtl((t) => Math.max(0, t - 1));
      setResendIn((r) => Math.max(0, r - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const setAt = (i: number, v: string) =>
    setDigits((d) => d.map((x, idx) => (idx === i ? v : x)));

  const handleChange = (i: number, raw: string) => {
    const v = raw.replace(/\D/g, "").slice(-1);
    setAt(i, v);
    setError("");
    if (v && i < OTP_LENGTH - 1) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowLeft" && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < OTP_LENGTH - 1) {
      refs.current[i + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!text) return;
    e.preventDefault();
    setDigits(Array.from({ length: OTP_LENGTH }, (_, i) => text[i] ?? ""));
    refs.current[Math.min(text.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (code.length !== OTP_LENGTH || loading || expired || locked) return;
    setLoading(true);
    setError("");
    try {
      // TODO: gọi API xác thực OTP của apps/api (module authentication):
      // const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-otp`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ phone, otp: code }),
      // });
      // if (!res.ok) throw new Error("invalid");
      await new Promise((r) => setTimeout(r, 600));
      onSuccess();
    } catch {
      const next = attempts + 1;
      setAttempts(next);
      setDigits(Array(OTP_LENGTH).fill(""));
      refs.current[0]?.focus();
      setError(
        next >= MAX_ATTEMPTS
          ? "Bạn đã nhập sai quá số lần cho phép. Vui lòng thử lại sau 15 phút."
          : `Mã OTP không chính xác. Bạn còn ${MAX_ATTEMPTS - next} lần thử.`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    if (resendIn > 0 || locked) return;
    // TODO: gọi API gửi lại OTP
    setDigits(Array(OTP_LENGTH).fill(""));
    setError("");
    setTtl(OTP_TTL_SECONDS);
    setResendIn(RESEND_SECONDS);
    refs.current[0]?.focus();
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-10 max-w-md text-center">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-[#2B6CB0] ring-8 ring-blue-50/60">
        <ShieldCheck className="h-8 w-8" />
      </span>

      <h2 className="mt-5 text-2xl font-extrabold text-slate-900">Xác thực số điện thoại</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">
        Mã OTP gồm {OTP_LENGTH} chữ số đã được gửi đến số{" "}
        <b className="text-slate-800">{maskPhone(phone)}</b>
      </p>

      {/* 6 ô nhập */}
      <div className="mt-7 flex justify-center gap-2.5 sm:gap-3" onPaste={handlePaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            value={d}
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={1}
            aria-label={`Chữ số thứ ${i + 1}`}
            disabled={expired || locked}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onFocus={(e) => e.target.select()}
            className={`h-14 w-11 rounded-xl border bg-slate-50 text-center text-2xl font-extrabold text-slate-900 outline-none transition sm:h-16 sm:w-14 ${
              error
                ? "border-red-300 bg-red-50"
                : "border-slate-200 focus:border-[#2B6CB0] focus:bg-white focus:ring-2 focus:ring-[#2B6CB0]/20"
            } disabled:cursor-not-allowed disabled:opacity-50`}
          />
        ))}
      </div>

      {/* Hiệu lực */}
      <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-500">
        <Clock className="h-3.5 w-3.5" />
        {expired ? (
          <span className="font-bold text-red-500">Mã OTP đã hết hiệu lực</span>
        ) : (
          <>
            Mã có hiệu lực trong <b className="text-[#174A8F]">{mmss(ttl)}</b>
          </>
        )}
      </p>

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={code.length !== OTP_LENGTH || loading || expired || locked}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#174A8F] px-6 py-3.5 text-sm font-bold uppercase text-white shadow transition hover:bg-[#0E3A75] disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {loading ? "Đang xác thực..." : "Xác thực & hoàn tất đăng ký"}
      </button>

      <div className="mt-4 text-xs text-slate-500">
        Chưa nhận được mã?{" "}
        <button
          type="button"
          onClick={handleResend}
          disabled={resendIn > 0 || locked}
          className="font-bold text-[#174A8F] hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline"
        >
          {resendIn > 0 ? `Gửi lại sau ${resendIn}s` : "Gửi lại mã OTP"}
        </button>
      </div>

      <button
        type="button"
        onClick={onBack}
        className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 transition hover:text-rose-700"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Quay lại chỉnh sửa thông tin
      </button>
    </form>
  );
}