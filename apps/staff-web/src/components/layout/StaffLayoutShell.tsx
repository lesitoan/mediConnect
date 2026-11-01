"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useGetCurrentUserQuery } from "@/features/users/services/usersApi";
import { StaffSidebar } from "./StaffSidebar";
import { StaffHeader } from "./StaffHeader";

interface StaffLayoutShellProps {
  children: React.ReactNode;
}

export function StaffLayoutShell({ children }: StaffLayoutShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: currentUser, isLoading, error } = useGetCurrentUserQuery();

  useEffect(() => {
    if (!isLoading) {
      const status = (error as { status?: number | string })?.status;
      if (status === 401 || (currentUser && currentUser.role === "PATIENT")) {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      }
    }
  }, [isLoading, error, currentUser, pathname, router]);

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
