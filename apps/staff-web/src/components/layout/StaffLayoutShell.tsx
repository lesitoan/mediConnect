"use client";

import { useState } from "react";
import { StaffSidebar } from "./StaffSidebar";
import { StaffHeader } from "./StaffHeader";

interface StaffLayoutShellProps {
  children: React.ReactNode;
}

export function StaffLayoutShell({ children }: StaffLayoutShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-[100dvh] bg-background">
      <StaffSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex flex-col lg:pl-[256px]">
        <StaffHeader onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />
        <main className="flex-1 p-4 sm:p-5 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
