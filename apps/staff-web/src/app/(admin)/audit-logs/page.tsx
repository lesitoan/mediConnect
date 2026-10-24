import { Suspense } from "react";
import type { Metadata } from "next";
import { Loading } from "@/components/shared/Loading";
import { AuditLogView } from "@/features/audit-logs/components/AuditLogView";

export const metadata: Metadata = {
  title: "Nhật ký hệ thống | MediConnect Staff",
  description:
    "Tra cứu lịch sử hoạt động và thay đổi dữ liệu trong hệ thống MediConnect",
};

export default function AuditLogsPage() {
  return (
    <Suspense fallback={<Loading className="min-h-screen" />}>
      <AuditLogView />
    </Suspense>
  );
}
