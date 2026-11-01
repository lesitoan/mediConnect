import type { Metadata } from "next";
import { Suspense } from "react";
import { Loading } from "@/components/shared/Loading";
import { ExaminationManagementView } from "@/features/examinations/components/ExaminationManagementView";
export const metadata: Metadata = {
  title: "Khám bệnh ngoại trú | MediConnect",
};
export default function ExaminationsPage() {
  return (
    <Suspense fallback={<Loading label="Đang tải phiên khám..." />}>
      <ExaminationManagementView />
    </Suspense>
  );
}
