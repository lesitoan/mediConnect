import type { Metadata } from "next";
import { Suspense } from "react";
import { Loading } from "@/components/shared/Loading";
import { ExceptionManagementView } from "@/features/exceptions/components";

export const metadata: Metadata = {
  title: "Xử lý ngoại lệ | MediConnect Staff",
  description: "Điều phối các thay đổi và xung đột lịch hẹn",
};

export default function ExceptionsPage() {
  return (
    <Suspense
      fallback={
        <Loading
          label="Đang tải lịch hẹn ngoại lệ..."
          className="min-h-[50vh]"
        />
      }
    >
      <ExceptionManagementView />
    </Suspense>
  );
}
