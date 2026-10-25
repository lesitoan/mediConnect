import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Home, ShieldCheck } from "@/components/layout/icons";
import LoginForm from "@/features/auth/components/LoginForm";
import LoginPromoPanel from "@/features/auth/components/LoginPromoPanel";

export const metadata: Metadata = {
  title: "Đăng nhập | MediConnect",
};

export default function LoginPage() {
  return (
    <section className="min-h-[calc(100vh-8rem)] bg-gradient-to-b from-[#EAF2FC] to-[#F3F7FE]">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mx-auto max-w-7xl px-4 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <ol className="flex items-center gap-1.5">
            <li>
              <Link href="/" className="flex items-center gap-1 hover:text-[#174A8F]">
                <Home className="h-3.5 w-3.5" />
                Trang chủ
              </Link>
            </li>
            <ChevronRight className="h-3 w-3" />
            <li>
              <Link href="/ho-so" className="hover:text-[#174A8F]">
                Cổng thông tin bệnh nhân
              </Link>
            </li>
            <ChevronRight className="h-3 w-3" />
            <li className="font-bold text-[#174A8F]">Đăng nhập tài khoản</li>
          </ol>
          <span className="flex items-center gap-1.5 font-semibold text-[#174A8F]">
            <ShieldCheck className="h-3.5 w-3.5" />
            Môi trường kết nối an toàn SSL 256-Bit
          </span>
        </div>
      </nav>

      {/* Thẻ đăng nhập */}
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
       <div className="grid overflow-hidden rounded-3xl bg-white shadow-[0_10px_40px_rgba(23,74,143,0.12)] lg:grid-cols-2">
          <LoginPromoPanel />
          <LoginForm />
        </div>
      </div>
    </section>
  );
}