"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { clearSession, type SessionUser } from "@/features/auth/useAuth";
import { openAiChat } from "./aiChat";
import {
  Asterisk,
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  PhoneCall,
  Plus,
  Shield,
  X,
} from "./icons";

const NAV_ITEMS: { label: string; href: string; ai?: boolean }[] = [
  { label: "Trang chủ", href: "/" },
  { label: "Đặt lịch khám", href: "/dat-lich" },
  { label: "Hồ sơ sức khỏe", href: "/ho-so-suc-khoe" },
  { label: "Lịch sử & Lịch hẹn", href: "/lich-su-lich-hen" },
  { label: "Trợ lý AI", href: "/tro-ly-ai", ai: true }, // mở popup, không dùng href
  //{ label: "Thanh toán viện phí", href: "/thanh-toan" },
  { label: "Hướng dẫn", href: "/huong-dan" },
];

// Khung full chiều ngang, chỉ chừa lề nhỏ hai bên
const wrap = "w-full px-4 sm:px-6 lg:px-10 2xl:px-16";

const linkCls = (active: boolean) =>
  `text-[13px] font-semibold transition ${
    active ? "text-[#0A5A84]" : "text-slate-700 hover:text-[#0A5A84]"
  }`;

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export default function AuthedHeader({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const handleLogout = () => {
    clearSession();
    setMenuOpen(false);
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm">
      {/* Thanh trên */}
      <div className="border-b border-slate-100 bg-[#F6FAFE]">
        <div className={`${wrap} flex h-10 items-center justify-between text-xs text-slate-600`}>
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5">
              <PhoneCall className="h-3.5 w-3.5 text-[#0A5A84]" />
              <span className="hidden sm:inline">Hotline:</span>
              <a href="tel:1900986868" className="font-bold text-slate-800">
                1900 986 868
              </a>
            </span>
            <span className="hidden items-center gap-1.5 md:flex">
              <Asterisk className="h-3.5 w-3.5 text-red-600" />
              Cấp cứu 24/7:
              <a href="tel:19008896" className="font-bold text-red-600">
                1900 8896
              </a>
            </span>
            <span className="hidden items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-[#0A5A84] lg:flex">
              <Shield className="h-3 w-3" />
              Bảo mật SSL 256-bit
            </span>
          </div>

          <div className="flex items-center gap-5">
            <Link
              href="/thong-bao"
              aria-label="Thông báo"
              className="relative text-slate-600 transition hover:text-[#0A5A84]"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#F6FAFE]" />
            </Link>

            {/* Tài khoản */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2.5"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#2B6CB0] to-[#0A5A84] text-[11px] font-bold text-white ring-2 ring-white">
                  {initials(user.fullName)}
                </span>
                <span className="hidden text-left leading-tight sm:block">
                  <span className="block text-[11px] font-bold text-slate-800">
                    {user.fullName}
                  </span>
                  <span className="block text-[10px] font-bold text-[#2B6CB0]">
                    {user.pid ?? "Tài khoản bệnh nhân"}
                  </span>
                </span>
                <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 sm:block" />
              </button>

              {menuOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Đóng menu"
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-slate-100 bg-white p-2 shadow-lg"
                  >
                    <Link
                      href="/ho-so-suc-khoe"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-[#0A5A84]"
                    >
                      Hồ sơ của tôi
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Đăng xuất
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Thanh chính */}
      <div className="border-b border-slate-100">
        <div className={`${wrap} flex h-[68px] items-center justify-between gap-4`}>
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2B6CB0] text-white shadow">
              <Plus className="h-5 w-5" strokeWidth={3} />
            </span>
            <span className="leading-none">
              <span className="block text-lg font-extrabold text-[#0A5A84]">
                MEDICONNECT
              </span>
              <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-wider text-[#0A5A84]">
                Hospital Portal
              </span>
            </span>
          </Link>

          {/* Menu giữa: flex-1 + justify-evenly để dàn đều */}
          <nav className="hidden flex-1 items-center justify-evenly px-4 xl:flex 2xl:px-10">
            {NAV_ITEMS.map((item) =>
              item.ai ? (
                <button
                  key={item.href}
                  type="button"
                  onClick={openAiChat}
                  aria-haspopup="dialog"
                  className={linkCls(false)}
                >
                  {item.label}
                </button>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={linkCls(isActive(item.href))}
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/dat-lich"
              className="hidden rounded-full bg-[#0A5A84] px-5 py-2.5 text-xs font-bold text-white shadow transition hover:bg-[#08486B] sm:block"
            >
              Đặt khám mới
            </Link>
            <button
              type="button"
              aria-label="Mở menu"
              onClick={() => setMobileOpen((v) => !v)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 xl:hidden"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="border-t border-slate-100 bg-white px-4 py-2 xl:hidden">
            {NAV_ITEMS.map((item) =>
              item.ai ? (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    openAiChat();
                  }}
                  className="block w-full border-b border-slate-50 py-3 text-left text-sm font-semibold text-slate-700"
                >
                  {item.label}
                </button>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block border-b border-slate-50 py-3 text-sm font-semibold last:border-0 ${
                    isActive(item.href) ? "text-[#0A5A84]" : "text-slate-700"
                  }`}
                >
                  {item.label}
                </Link>
              ),
            )}
            <Link
              href="/dat-lich"
              onClick={() => setMobileOpen(false)}
              className="my-3 block rounded-full bg-[#0A5A84] py-2.5 text-center text-xs font-bold text-white"
            >
              Đặt khám mới
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}