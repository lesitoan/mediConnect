import type { Metadata } from "next";
import { Suspense } from "react";
import { Loading } from "@/components/shared/Loading";
import { QueueManagementView } from "@/features/queues/components";

export const metadata: Metadata = {
  title: "Quản lý hàng chờ khám bệnh | MediConnect Staff",
  description: "Theo dõi và điều phối bệnh nhân đang chờ khám",
};

export default function QueuesPage() {
  return (
    <Suspense
      fallback={
        <Loading label="Đang tải hàng chờ..." className="min-h-[560px]" />
      }
    >
      <QueueManagementView />
    </Suspense>
  );
}
