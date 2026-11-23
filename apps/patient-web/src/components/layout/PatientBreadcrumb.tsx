"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, Home } from "@/components/layout/icons";

export type PatientBreadcrumbPage = "booking" | "profile" | "appointments";

const PAGE_LABELS: Record<PatientBreadcrumbPage, string> = {
  booking: "Đặt lịch khám",
  profile: "Hồ sơ cá nhân",
  appointments: "Lịch sử & Lịch hẹn",
};

const PAGE_BACKGROUND_CLASSES: Record<PatientBreadcrumbPage, string> = {
  booking: "bg-[#EAF4FE]",
  profile: "bg-[#EAF3FD]",
  appointments: "bg-[#EAF3FD]",
};

const DEFAULT_HEADER_HEIGHT = 108;

export default function PatientBreadcrumb({
  currentPage,
}: {
  currentPage: PatientBreadcrumbPage;
}) {
  const [headerHeight, setHeaderHeight] = useState(DEFAULT_HEADER_HEIGHT);

  useEffect(() => {
    const header = document.querySelector("header");

    if (!header) {
      return;
    }

    const updateHeaderHeight = () => {
      setHeaderHeight(header.getBoundingClientRect().height);
    };

    updateHeaderHeight();
    const resizeObserver = new ResizeObserver(updateHeaderHeight);
    resizeObserver.observe(header);

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <nav
      aria-label="Đường dẫn điều hướng"
      style={{ top: headerHeight }}
      className={`sticky z-40 w-full border-b border-[#C9DFEE] shadow-[0_4px_14px_rgba(20,73,112,0.08)] ${PAGE_BACKGROUND_CLASSES[currentPage]}`}
    >
      <div className="flex h-12 w-full items-center px-4 sm:px-6 lg:px-10 2xl:px-16">
        <ol className="flex items-center gap-2 text-[12px] text-[#63768A] sm:text-[13px]">
          <li>
            <Link href="/" className="inline-flex items-center gap-2 font-medium transition hover:text-[#08739B]">
              <Home className="h-4 w-4" />
              Trang chủ
            </Link>
          </li>
          <li aria-hidden="true"><ChevronRight className="h-3.5 w-3.5 text-[#9AACBC]" /></li>
          {currentPage === "appointments" && (
            <>
              <li>
                <Link href="/ho-so-suc-khoe" className="font-medium transition hover:text-[#08739B]">
                  Hồ sơ cá nhân
                </Link>
              </li>
              <li aria-hidden="true"><ChevronRight className="h-3.5 w-3.5 text-[#9AACBC]" /></li>
            </>
          )}
          <li aria-current="page" className="font-extrabold text-[#075C82]">
            {PAGE_LABELS[currentPage]}
          </li>
        </ol>
      </div>
    </nav>
  );
}
