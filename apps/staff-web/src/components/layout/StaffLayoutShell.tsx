"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loading } from "@/components/shared/Loading";
import { Button } from "@/components/ui/button";
import { useGetAuthUserQuery } from "@/features/auth/services/authApi";
import {
  canAccessStaffPath,
  getPostLoginDestination,
  isStaffRole,
} from "@/features/auth/authRoutes";
import { StaffSidebar } from "./StaffSidebar";
import { StaffHeader } from "./StaffHeader";

interface StaffLayoutShellProps {
  children: React.ReactNode;
}

export function StaffLayoutShell({ children }: StaffLayoutShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const {
    data: currentUser,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetAuthUserQuery(undefined, { refetchOnMountOrArgChange: true });

  const isUnauthorized =
    !isLoading &&
    !isFetching &&
    ((error as { status?: number | string })?.status === 401 ||
      (currentUser && !isStaffRole(currentUser.role)));

  useEffect(() => {
    if (isUnauthorized) {
      router.replace(
        `/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`,
      );
    } else if (
      !error &&
      !isFetching &&
      isStaffRole(currentUser?.role) &&
      !canAccessStaffPath(currentUser.role, pathname)
    ) {
      router.replace(getPostLoginDestination(currentUser.role));
    }
  }, [isUnauthorized, currentUser, error, isFetching, pathname, router]);

  if (
    isLoading ||
    isFetching ||
    isUnauthorized ||
    (!error && currentUser && !canAccessStaffPath(currentUser.role, pathname))
  ) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Loading label="Đang xác thực phiên đăng nhập..." />
      </div>
    );
  }

  if (error || !currentUser) {
    return (
      <div
        role="alert"
        className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background p-6 text-center"
      >
        <p className="text-body text-muted">
          Không thể xác minh phiên đăng nhập. Vui lòng thử lại.
        </p>
        <Button onClick={() => void refetch()}>Thử lại</Button>
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
        <StaffHeader
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        />
        <main className="flex-1 p-4 sm:p-5 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
