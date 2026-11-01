"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loading } from "@/components/shared/Loading";
import { useGetCurrentUserQuery } from "@/features/auth/services/authApi";
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

  const isUnauthorized =
    !isLoading &&
    ((error as { status?: number | string })?.status === 401 ||
      (currentUser && currentUser.role === "PATIENT"));

  useEffect(() => {
    if (isUnauthorized) {
      toast.dismiss();
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isUnauthorized, pathname, router]);

  if (isUnauthorized) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <Loading label="Đang chuyển hướng đăng nhập..." />
      </div>
    );
  }

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
