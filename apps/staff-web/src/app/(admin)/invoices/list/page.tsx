import { Suspense } from "react";
import type { Metadata } from "next";
import { Loading } from "@/components/shared/Loading";
import { InvoiceManagementView } from "@/features/invoices/components/InvoiceManagementView";

export const metadata: Metadata = {
  title: "Hóa đơn | MediConnect Staff",
  description: "Tra cứu hóa đơn và theo dõi thanh toán của bệnh nhân.",
};

export default function InvoiceListPage() {
  return (
    <Suspense
      fallback={<Loading label="Đang tải hóa đơn..." className="min-h-64" />}
    >
      <InvoiceManagementView key="INVOICES" mode="INVOICES" />
    </Suspense>
  );
}
