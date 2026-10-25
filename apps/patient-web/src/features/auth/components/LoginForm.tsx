"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Eye,
  EyeOff,
  Headset,
  Lock,
  User,
} from "@/components/layout/icons";
import { saveSession } from "../useAuth";

const inputWrap =
  "flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 transition focus-within:border-[#2B6CB0] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#2B6CB0]/20";
const inputBase =
  "w-full bg-transparent py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400";

export default function LoginForm() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = identifier.trim() !== "" && password.length >= 6;

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!canSubmit || loading) return;
    setError("");
    setLoading(true);
    try {
      // TODO: gọi API đăng nhập của apps/api (module authentication), ví dụ:
      // const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ identifier: identifier.trim(), password, remember }),
      // });
      // if (!res.ok) throw new Error("Sai thông tin đăng nhập");
      // const data = await res.json();
      // rồi lấy fullName, pid từ phản hồi thay cho dữ liệu mẫu bên dưới
      await new Promise((r) => setTimeout(r, 600));

      // Session giả lập để dựng giao diện sau đăng nhập
      saveSession({ fullName: "Nguyễn Văn An", pid: "BN-8896" });
      router.push("/");
    } catch {
      setError("Thông tin đăng nhập không chính xác. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center p-6 md:p-10">
      <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-[#174A8F]">
        <span className="h-2 w-2 rounded-full bg-[#2B6CB0]" />
        Cổng bệnh nhân trực tuyến
      </span>
      <h1 className="mt-2 text-3xl font-extrabold text-[#174A8F] md:text-4xl">
        Đăng Nhập Tài Khoản
      </h1>
      <p className="mt-2 text-xs text-slate-500">
        Nhập số điện thoại/PID hoặc quét mã để truy cập hồ sơ bệnh án.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {/* Định danh */}
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <label htmlFor="identifier" className="font-bold text-slate-700">
              Số điện thoại / Email / Mã PID
            </label>
            <Link href="/ma-pid" className="font-bold text-[#174A8F] hover:underline">
              Mã PID là gì?
            </Link>
          </div>
          <div className={inputWrap}>
            <User className="h-4 w-4 shrink-0 text-[#2B6CB0]" />
            <input
              id="identifier"
              className={inputBase}
              placeholder="VD: 0905 123 456 hoặc BN-8896"
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </div>
        </div>

        {/* Mật khẩu */}
        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-xs font-bold text-slate-700"
          >
            Mật khẩu
          </label>
          <div className={inputWrap}>
            <Lock className="h-4 w-4 shrink-0 text-[#2B6CB0]" />
            <input
              id="password"
              type={showPw ? "text" : "password"}
              className={inputBase}
              placeholder="Nhập mật khẩu an toàn"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              aria-label={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              onClick={() => setShowPw((v) => !v)}
              className="text-slate-400 transition hover:text-[#174A8F]"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <label className="flex cursor-pointer items-center gap-2 text-slate-600">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 accent-[#2B6CB0]"
            />
            Ghi nhớ đăng nhập
          </label>
          <Link href="/quen-mat-khau" className="font-bold text-[#174A8F] hover:underline">
            Quên mật khẩu?
          </Link>
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit || loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#174A8F] px-6 py-3.5 text-sm font-bold uppercase text-white shadow transition hover:bg-[#0E3A75] disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {loading ? "Đang xử lý..." : "Đăng nhập vào hồ sơ"}
          {!loading && <ArrowRight className="h-4 w-4" />}
        </button>
      </form>

      {/* Đăng ký */}
      <div className="mt-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-snug text-slate-600">
          <b className="block text-slate-800">Chưa có tài khoản bệnh nhân?</b>
          Kích hoạt hồ sơ sức khỏe trực tuyến chỉ mất 1 phút bằng CCCD gắn chip.
        </p>
        <Link
          href="/register"
          className="shrink-0 rounded-lg bg-[#174A8F] px-5 py-2.5 text-center text-xs font-bold text-white transition hover:bg-[#0E3A75]"
        >
          Đăng ký ngay
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <Headset className="h-3.5 w-3.5 text-[#2B6CB0]" />
          Tổng đài CSKH: <b className="text-[#174A8F]">1900 986 868</b>
        </span>
        <span className="flex items-center gap-1.5">
          <BadgeCheck className="h-3.5 w-3.5 text-[#2B6CB0]" />
          Hỗ trợ kỹ thuật 24/7
        </span>
      </div>
    </div>
  );
}