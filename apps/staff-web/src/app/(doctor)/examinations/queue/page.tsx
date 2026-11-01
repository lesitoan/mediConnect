import { Suspense } from "react";
import { Loading } from "@/components/shared/Loading";
import { DoctorQueueView } from "@/features/examinations/components/DoctorQueueView";
export default function DoctorQueuePage() {
  return (
    <Suspense fallback={<Loading label="Đang tải hàng chờ..." />}>
      <DoctorQueueView />
    </Suspense>
  );
}
