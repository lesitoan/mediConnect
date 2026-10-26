"use client";

import Link from "next/link";
import { useState } from "react";
import { Ambulance, Globe, IdCard, Lock, PhoneCall } from "./icons";

type Lang = "vi" | "en";

export default function TopBar() {
  const [lang, setLang] = useState<Lang>("vi");

  return (
    <div className="bg-[#174A8F] text-white">
      <div className="flex h-10 w-full items-center justify-between px-4 text-sm sm:px-6 lg:px-10 2xl:px-16">
        {/* Trái: hotline */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <PhoneCall className="h-4 w-4" />
            <span className="hidden sm:inline">Hotline:</span>
            <a href="tel:1900986868" className="font-bold">
              1900 986 868
            </a>
          </div>

          <span className="hidden h-4 w-px bg-white/30 md:block" />

          <div className="hidden items-center gap-2 md:flex">
            <Ambulance className="h-4 w-4" />
            <span>Cấp cứu 24/7:</span>
            <a href="tel:19008896" className="font-bold">
              1900 8896
            </a>
          </div>
        </div>

        {/* Phải: đăng nhập / đăng ký / ngôn ngữ */}
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="flex items-center gap-1.5 transition hover:text-white/80"
          >
            <Lock className="h-4 w-4" />
            <span>Đăng nhập</span>
          </Link>

          <span className="h-4 w-px bg-white/30" />

          <Link
            href="/register"
            className="flex items-center gap-1.5 transition hover:text-white/80"
          >
            <IdCard className="h-4 w-4" />
            <span>Đăng ký</span>
          </Link>

          <span className="hidden h-4 w-px bg-white/30 sm:block" />

          <div className="hidden items-center gap-2 sm:flex">
            <Globe className="h-4 w-4" />

            <button
              type="button"
              aria-label="Tiếng Việt"
              onClick={() => setLang("vi")}
              className={`flex h-5 w-7 items-center justify-center rounded-sm bg-[#DA251D] text-[11px] leading-none text-[#FFFF00] ring-2 transition ${
                lang === "vi" ? "ring-white" : "opacity-70 ring-transparent"
              }`}
            >
              ★
            </button>

            <button
              type="button"
              aria-label="English"
              onClick={() => setLang("en")}
              className={`h-5 rounded-sm bg-white px-1.5 text-[10px] font-bold leading-none text-[#174A8F] ring-2 transition ${
                lang === "en" ? "ring-white" : "opacity-70 ring-transparent"
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}