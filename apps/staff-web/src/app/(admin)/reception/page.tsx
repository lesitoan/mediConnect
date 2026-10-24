import { Suspense } from "react";
import type { Metadata } from "next";
import { Loading } from "@/components/shared/Loading";
import { ReceptionManagementView } from "@/features/reception/components";

export const metadata: Metadata = {
  title: "Tiếp nhận bệnh nhân | MediConnect Staff",
  description:
    "Tiếp nhận & Check-in bệnh nhân theo lịch hẹn và tiếp nhận vãng lai tại quầy",
};

export default function ReceptionPage() {
  return (
    <Suspense fallback={<Loading className="min-h-screen" />}>
      <ReceptionManagementView />
    </Suspense>
  );
}
