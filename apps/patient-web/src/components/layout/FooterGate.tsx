"use client";

import { usePathname } from "next/navigation";

const HIDE_FOOTER_ON = ["/login", "/register"];

export default function FooterGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (HIDE_FOOTER_ON.includes(pathname)) return null;
  return <>{children}</>;
}