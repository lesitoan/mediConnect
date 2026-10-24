import type { Metadata } from "next";
import { Suspense } from "react";
import { Loading } from "@/components/shared/Loading";
import { ScheduleApprovalsView } from "@/features/schedules/approvals/components";

export const metadata: Metadata = {
  title: "Yêu cầu chờ duyệt | MediConnect Staff",
  description: "Xem xét và phê duyệt yêu cầu thay đổi lịch của nhân sự y tế",
};

export default function ScheduleApprovalsPage() {
  return (
    <Suspense fallback={<Loading className="min-h-screen" />}>
      <ScheduleApprovalsView />
    </Suspense>
  );
}

