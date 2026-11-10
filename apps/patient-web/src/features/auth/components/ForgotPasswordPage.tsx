"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  Eye,
  EyeOff,
  Headset,
  Info,
  Lock,
  Send,
  ShieldCheck,
  User,
} from "@/components/layout/icons";
import {
  getAuthErrorMessage,
  type OtpChallenge,
} from "../services/authService";
import {
  requestPasswordReset,
  resetPassword,
} from "../services/passwordRecoveryService";
import OtpVerifyForm from "./OtpVerifyForm";

const inputWrap =
  "flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 transition focus-within:border-[#2B6CB0] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#2B6CB0]/20";
const inputBase =
  "w-full bg-transparent py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400";

type Step = "request" | "otp" | "reset" | "done";

function RecoveryPanel({ step }: { step: Step }) {
  const items = [
    { icon: User, title: "Xác minh tài khoản", text: "Nhập số điện thoại hoặc email đã đăng ký với hệ thống." },
    { icon: ShieldCheck, title: "Nhận mã OTP an toàn", text: "Nhận mã xác thực qua SMS hoặc email trong vài giây." },
    { icon: Lock, title: "Tạo mật khẩu mới", text: "Đặt mật khẩu mới để khôi phục quyền truy cập tài khoản." },
  ];
  const activeIndex = step === "request" ? 0 : step === "otp" ? 1 : 2;

  return (
    <aside className="relative overflow-hidden bg-gradient-to-br from-[#1769AE] to-[#0B478E] p-7 text-white md:p-10 lg:w-[48%]">
      <div className="pointer-events-none absolute -right-16 -top-16 text-[240px] font-black leading-none text-white/10">+</div>
      <div className="relative flex h-full flex-col">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-[10px] font-bold uppercase tracking-wide">
          <ShieldCheck className="h-4 w-4" /> Hỗ trợ khôi phục tài khoản
        </span>
        <h1 className="mt-8 max-w-md text-3xl font-extrabold leading-tight md:text-4xl">
          {step === "reset" || step === "done" ? "Tạo mật khẩu mới an toàn" : "Khôi phục quyền truy cập hồ sơ bệnh nhân"}
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-blue-100">
          Hoàn tất xác thực để tiếp tục quản lý hồ sơ sức khỏe và sử dụng các dịch vụ của MediConnect.
        </p>

        <div className="mt-8 space-y-3">
          {items.map(({ icon: Icon, title, text }, index) => (
            <div
              key={title}
              className={`flex items-start gap-3 rounded-2xl border p-4 ${
                index === activeIndex
                  ? "border-white/30 bg-white/20"
                  : "border-white/15 bg-white/10"
              }`}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <Icon className="h-6 w-6" />
              </span>
              <span>
                <span className="block text-sm font-extrabold">{title}</span>
                <span className="mt-1 block text-xs leading-relaxed text-blue-100">{text}</span>
              </span>
            </div>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between gap-4 pt-10 text-[11px] text-blue-100">
          <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" /> Chuẩn HIPAA</span>
          <span className="flex items-center gap-1.5"><Lock className="h-4 w-4" /> Mã hóa SSL 256-bit</span>
        </div>
      </div>
    </aside>
  );
}

function ResetPasswordForm({
  resetToken,
  onSuccess,
}: {
  resetToken: string;
  onSuccess: () => void;
}) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const isValid =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/.test(password) &&
    password === confirmation;

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValid || isSubmitting) return;
    setIsSubmitting(true);
    setError("");
    try {
      await resetPassword(resetToken, password);
      onSuccess();
    } catch (resetError) {
      setError(getAuthErrorMessage(resetError, "Không thể cập nhật mật khẩu lúc này."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-7 space-y-4">
      <div>
        <label htmlFor="new-password" className="mb-1.5 block text-xs font-bold text-slate-700">Mật khẩu mới</label>
        <div className={inputWrap}>
          <Lock className="h-4 w-4 shrink-0 text-[#2B6CB0]" />
          <input id="new-password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Nhập mật khẩu mới" autoComplete="new-password" className={inputBase} />
          <button type="button" aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} onClick={() => setShowPassword((value) => !value)} className="text-slate-400 hover:text-[#174A8F]">
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div>
        <label htmlFor="confirm-password" className="mb-1.5 block text-xs font-bold text-slate-700">Xác nhận mật khẩu</label>
        <div className={inputWrap}>
          <Lock className="h-4 w-4 shrink-0 text-[#2B6CB0]" />
          <input id="confirm-password" type={showConfirmation ? "text" : "password"} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Nhập lại mật khẩu mới" autoComplete="new-password" className={inputBase} />
          <button type="button" aria-label={showConfirmation ? "Ẩn mật khẩu" : "Hiện mật khẩu"} onClick={() => setShowConfirmation((value) => !value)} className="text-slate-400 hover:text-[#174A8F]">
            {showConfirmation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div className="rounded-2xl bg-blue-50 px-4 py-3 text-xs text-slate-600">
        <p className="flex items-center gap-2 font-bold text-slate-800"><Info className="h-4 w-4 text-[#2B6CB0]" /> Yêu cầu mật khẩu</p>
        <ul className="mt-2 grid gap-1 pl-6 text-[11px] sm:grid-cols-2">
          <li>Tối thiểu 8 ký tự</li><li>Bao gồm chữ hoa và chữ thường</li><li>Có ít nhất 1 số</li><li>Có ít nhất 1 ký tự đặc biệt</li>
        </ul>
      </div>
      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
      <button type="submit" disabled={!isValid || isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1769AE] px-6 py-3.5 text-sm font-bold text-white shadow transition hover:bg-[#0E3A75] disabled:cursor-not-allowed disabled:bg-slate-300">
        {isSubmitting ? "Đang cập nhật..." : "Cập nhật mật khẩu"}<ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("request");
  const [identifier, setIdentifier] = useState("");
  const [challenge, setChallenge] = useState<OtpChallenge | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const isContactValid = useMemo(() => {
    const value = identifier.trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || /^(0\d{9}|\+84\d{9})$/.test(value.replace(/[ -]/g, ""));
  }, [identifier]);

  const requestOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isContactValid || isSubmitting) return;
    setIsSubmitting(true);
    setError("");
    try {
      setChallenge(await requestPasswordReset(identifier));
      setStep("otp");
    } catch (requestError) {
      setError(getAuthErrorMessage(requestError, "Không thể gửi mã xác thực lúc này."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="min-h-[calc(100vh-8rem)] bg-gradient-to-b from-[#EAF2FC] to-[#F3F7FE] px-4 py-8 md:py-12">
      <div className="mx-auto flex min-h-[620px] max-w-6xl overflow-hidden rounded-3xl bg-white shadow-[0_10px_40px_rgba(23,74,143,0.14)]">
        <RecoveryPanel step={step} />
        <main className="flex flex-1 flex-col justify-center p-6 md:p-10">
          {step === "request" && (
            <>
              <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-[#174A8F]"><span className="h-2 w-2 rounded-full bg-[#2B6CB0]" /> Cổng bệnh nhân trực tuyến</span>
              <h2 className="mt-3 text-3xl font-extrabold text-[#174A8F] md:text-4xl">Quên mật khẩu</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">Nhập số điện thoại hoặc email đã đăng ký để nhận mã xác thực đặt lại mật khẩu.</p>
              <form onSubmit={requestOtp} className="mt-7 space-y-4">
                <label htmlFor="recovery-contact" className="block text-xs font-bold text-slate-700">Số điện thoại / Email</label>
                <div className={inputWrap}><User className="h-4 w-4 shrink-0 text-[#2B6CB0]" /><input id="recovery-contact" value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="VD: 0905 123 456 hoặc email@example.com" autoComplete="username" className={inputBase} /></div>
                {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
                <button type="submit" disabled={!isContactValid || isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1769AE] px-6 py-3.5 text-sm font-bold text-white shadow transition hover:bg-[#0E3A75] disabled:cursor-not-allowed disabled:bg-slate-300">{isSubmitting ? "Đang gửi..." : "Gửi mã xác thực"}<Send className="h-4 w-4" /></button>
              </form>
              <div className="mt-6 flex gap-3 rounded-2xl bg-blue-50 px-4 py-4 text-xs text-slate-600"><Info className="h-5 w-5 shrink-0 text-[#2B6CB0]" /><span><b className="block text-slate-800">Hệ thống sẽ gửi mã OTP bảo mật</b>Chúng tôi sẽ gửi một mã OTP đến số điện thoại hoặc email đã đăng ký.</span></div>
            </>
          )}
          {step === "otp" && challenge && <OtpVerifyForm phone={identifier} challenge={challenge} purpose="RESET_PASSWORD" onResend={() => requestPasswordReset(identifier)} onBack={() => setStep("request")} onSuccess={(token) => { if (token) { setResetToken(token); setStep("reset"); } }} />}
          {step === "reset" && resetToken && (
            <>
              <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-[#174A8F]"><span className="h-2 w-2 rounded-full bg-[#2B6CB0]" /> Khôi phục tài khoản</span>
              <h2 className="mt-3 text-3xl font-extrabold text-[#174A8F] md:text-4xl">Đặt lại mật khẩu</h2>
              <p className="mt-2 text-sm text-slate-500">Tạo mật khẩu mới để khôi phục tài khoản của bạn một cách an toàn.</p>
              <ResetPasswordForm resetToken={resetToken} onSuccess={() => setStep("done")} />
              <button type="button" onClick={() => setStep("otp")} className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-[#174A8F] hover:underline"><ArrowLeft className="h-3.5 w-3.5" /> Quay lại xác thực OTP</button>
            </>
          )}
          {step === "done" && <div className="py-12 text-center"><span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><Check className="h-8 w-8" /></span><h2 className="mt-5 text-2xl font-extrabold text-slate-900">Đặt lại mật khẩu thành công</h2><p className="mt-3 text-sm text-slate-600">Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ.</p><Link href="/login" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#174A8F] px-8 py-3 text-sm font-bold text-white">Đăng nhập ngay<ArrowRight className="h-4 w-4" /></Link></div>}
          {step !== "otp" && step !== "done" && <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5 text-[11px] text-slate-500"><Link href="/login" className="inline-flex items-center gap-1.5 font-bold text-[#174A8F] hover:underline"><ArrowLeft className="h-3.5 w-3.5" /> Quay lại đăng nhập</Link><span className="flex items-center gap-1.5"><Headset className="h-3.5 w-3.5 text-[#2B6CB0]" /> CSKH: <b className="text-[#174A8F]">1900 986 868</b></span><BadgeCheck className="h-4 w-4 text-[#2B6CB0]" /></div>}
        </main>
      </div>
    </section>
  );
}
