import type { Metadata } from "next";
import { Suspense } from "react";
import { Loading } from "@/components/shared/Loading";
import { DiagnosticResultsView } from "@/features/diagnostic-results/components/DiagnosticResultsView";
export const metadata: Metadata = {
  title: "Trả kết quả cận lâm sàng | MediConnect",
};
export default function DiagnosticResultsPage() {
  return (
    <Suspense fallback={<Loading label="Đang tải chỉ định..." />}>
      <DiagnosticResultsView />
    </Suspense>
  );
}
