import { Suspense } from "react";
import type { Metadata } from "next";
import { Loading } from "@/components/shared/Loading";
import { InvoiceManagementView } from "@/features/invoices/components/InvoiceManagementView";

export const metadata: Metadata = {
  title: "Chờ lập hóa đơn | MediConnect Staff",
  description: "Lập hóa đơn cho các phiên khám đã hoàn tất.",
};

export default function BillingCandidatesPage() {
  return (
    <Suspense
      fallback={<Loading label="Đang tải phiên khám..." className="min-h-64" />}
    >
      <InvoiceManagementView key="CANDIDATES" mode="CANDIDATES" />
    </Suspense>
  );
}
