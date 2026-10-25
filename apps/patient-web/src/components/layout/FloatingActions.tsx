"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AiChatWidget from "./AiChatWidget";
import { ArrowUp, Bot, Calendar, Siren } from "./icons";

export default function FloatingActions() {
  const [showTop, setShowTop] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {chatOpen && <AiChatWidget onClose={() => setChatOpen(false)} />}

      <div
        className={`fixed bottom-5 right-4 z-40 flex flex-col items-end gap-3 md:right-6 ${
          chatOpen ? "pointer-events-none opacity-0" : ""
        }`}
      >
        <Link
          href="/dat-lich"
          className="flex items-center gap-3 rounded-full bg-white py-2 pl-5 pr-2 text-xs font-bold text-[#174A8F] shadow-lg ring-1 ring-slate-200 transition hover:shadow-xl"
        >
          Đặt lịch khám
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50">
            <Calendar className="h-4 w-4" />
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setChatOpen(true)}
          aria-haspopup="dialog"
          className="flex items-center gap-3 rounded-full bg-white py-2 pl-5 pr-2 text-xs font-bold text-[#174A8F] shadow-lg ring-1 ring-slate-200 transition hover:shadow-xl"
        >
          Trợ lý AI
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100">
            <Bot className="h-4 w-4" />
          </span>
        </button>

        <a
          href="tel:19008896"
          className="flex items-center gap-3 rounded-full bg-[#B91C1C] py-2 pl-5 pr-2 text-xs font-bold text-white shadow-lg transition hover:bg-[#991B1B]"
        >
          Cấp cứu 24/7
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
            <Siren className="h-4 w-4" />
          </span>
        </a>

        <button
          type="button"
          aria-label="Lên đầu trang"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className={`flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-600 shadow-lg ring-1 ring-slate-200 transition hover:text-[#174A8F] ${
            showTop ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      </div>
    </>
  );
}