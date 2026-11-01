import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthHeroPanel, LoginForm } from "@/features/auth";

export const metadata: Metadata = {
  title: "Đăng nhập | Cổng nhân sự y tế MediConnect",
  description:
    "Cổng điều hành và quản lý lâm sàng dành cho Bác sĩ, Lễ tân và Quản trị viên MediConnect.",
};

export default function LoginPage() {
  return (
    <main className="flex h-screen max-h-screen w-screen overflow-hidden items-center justify-center bg-background p-3 sm:p-4">
      <div className="mx-auto w-full max-w-4xl max-h-[95vh] overflow-hidden rounded-app-2xl border border-border bg-surface shadow-modal">
        <div className="grid lg:grid-cols-2">
          <AuthHeroPanel />
          <Suspense
            fallback={
              <div className="flex h-80 items-center justify-center text-caption text-muted">
                Đang tải biểu mẫu...
              </div>
            }
          >
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
