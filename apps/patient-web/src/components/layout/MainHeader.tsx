"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Menu, Search, X } from "./icons";

type NavItem = {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
};

const NAV_ITEMS: NavItem[] = [
  { label: "Trang chủ", href: "/" },
  {
    label: "Giới thiệu",
    href: "/gioi-thieu",
    children: [
      { label: "Về MediConnect", href: "/gioi-thieu" },
      { label: "Đội ngũ bác sĩ", href: "/gioi-thieu/bac-si" },
      { label: "Cơ sở vật chất", href: "/gioi-thieu/co-so-vat-chat" },
    ],
  },
  {
    label: "Dịch vụ",
    href: "/dich-vu",
    children: [
      { label: "Khám ngoại trú", href: "/dich-vu/kham-ngoai-tru" },
      { label: "Đặt lịch khám", href: "/dat-lich" },
      { label: "Thanh toán trực tuyến", href: "/dich-vu/thanh-toan" },
    ],
  },
  {
    label: "Chuyên khoa",
    href: "/chuyen-khoa",
    children: [
      { label: "Tất cả chuyên khoa", href: "/chuyen-khoa" },
      { label: "Nội tổng quát", href: "/chuyen-khoa/noi-tong-quat" },
      { label: "Tim mạch", href: "/chuyen-khoa/tim-mach" },
      { label: "Da liễu", href: "/chuyen-khoa/da-lieu" },
    ],
  },
  { label: "Tin tức", href: "/tin-tuc" },
  { label: "Đào tạo & NCKH", href: "/dao-tao-nckh" },
  { label: "Tra cứu", href: "/tra-cuu" },
  { label: "Liên hệ", href: "/lien-he" },
];

export default function MainHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSub, setOpenSub] = useState<string | null>(null);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="border-b border-slate-100 bg-white shadow-sm">
      <div className="flex h-[72px] w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-10 2xl:px-16">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#2B6CB0] to-[#174A8F] shadow">
            <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white">
              H
            </span>
          </span>
          <span className="leading-tight">
            <span className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-wide text-[#174A8F]">
                MEDICONNECT
              </span>
              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                Hospital
              </span>
            </span>
            <span className="hidden text-[11px] font-medium text-slate-500 sm:block">
              Y ĐỨC HÀNG ĐẦU · NHIỆM MÀU CUỘC SỐNG
            </span>
          </span>
        </Link>

        {/* Menu desktop: flex-1 + justify-evenly để dàn đều */}
        <nav className="hidden flex-1 items-center justify-evenly px-4 lg:flex 2xl:px-10">
          {NAV_ITEMS.map((item) => (
            <div key={item.label} className="group relative">
              <Link
                href={item.href}
                className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold uppercase transition ${
                  isActive(item.href)
                    ? "bg-blue-50 text-[#174A8F]"
                    : "text-slate-700 hover:bg-slate-50 hover:text-[#174A8F]"
                }`}
              >
                {item.label}
                {item.children && (
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400 transition group-hover:rotate-180" />
                )}
              </Link>

              {item.children && (
                <div className="invisible absolute left-0 top-full z-50 min-w-[220px] translate-y-1 rounded-xl border border-slate-100 bg-white p-2 opacity-0 shadow-lg transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-[#174A8F]"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/tim-kiem"
            aria-label="Tìm kiếm"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:bg-slate-50"
          >
            <Search className="h-4 w-4" />
          </Link>

          <button
            type="button"
            aria-label="Mở menu"
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-700 lg:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {mobileOpen && (
        <nav className="border-t border-slate-100 bg-white px-4 py-2 lg:hidden">
          {NAV_ITEMS.map((item) => (
            <div key={item.label} className="border-b border-slate-50 last:border-0">
              <div className="flex items-center justify-between">
                <Link
                  href={item.href}
                  onClick={() => !item.children && setMobileOpen(false)}
                  className={`flex-1 py-3 text-sm font-semibold uppercase ${
                    isActive(item.href) ? "text-[#174A8F]" : "text-slate-700"
                  }`}
                >
                  {item.label}
                </Link>
                {item.children && (
                  <button
                    type="button"
                    aria-label={`Mở ${item.label}`}
                    onClick={() =>
                      setOpenSub(openSub === item.label ? null : item.label)
                    }
                    className="p-2"
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition ${
                        openSub === item.label ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                )}
              </div>

              {item.children && openSub === item.label && (
                <div className="mb-2 ml-3 border-l-2 border-blue-100 pl-3">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={() => setMobileOpen(false)}
                      className="block py-2 text-sm text-slate-600"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      )}
    </div>
  );
}