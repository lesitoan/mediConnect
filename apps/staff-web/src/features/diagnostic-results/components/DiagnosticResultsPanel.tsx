"use client";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type {
  LabOrderItem,
  LabResult,
} from "@/features/examinations/types/examinationTypes";
import { formatDiagnosticTime } from "../diagnosticUtils";
import { DiagnosticImageGallery } from "./DiagnosticImageGallery";
export function DiagnosticResultsPanel({
  careSessionId,
  serverResults = [],
  labOrderItems = [],
}: {
  careSessionId: string;
  serverResults?: readonly LabResult[];
  labOrderItems?: readonly LabOrderItem[];
}) {
  const pending = labOrderItems.filter(
    (order) => order.status !== "COMPLETED",
  ).length;
  return (
    <Card className="space-y-4 p-5 shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-heading font-bold">Kết quả cận lâm sàng</h2>
        <Badge
          variant={serverResults.length ? "success" : "neutral"}
        >
          {serverResults.length} kết quả đã trả
        </Badge>
      </div>
      {pending > 0 && (
        <p className="text-body text-muted">
          Còn {pending} chỉ định chưa hoàn tất. Ảnh và nhận xét còn nháp chưa
          hiển thị trong hồ sơ.
        </p>
      )}
      {!serverResults.length && (
        <div className="rounded-app-lg border border-dashed border-border-strong bg-background p-5 text-center text-body text-muted">
          Chưa có kết quả được trả về cho phiên khám này.
        </div>
      )}
      {serverResults.map((result, index) => (
        <section
          key={result.orderRef + index}
          className="space-y-2 rounded-app-lg border border-border p-4"
        >
          <h3 className="text-body font-bold">{result.orderRef}</h3>
          <p className="whitespace-pre-wrap text-body">{result.result}</p>
          <DiagnosticImageGallery
            careSessionId={careSessionId}
            images={result.images ?? []}
          />
          <p className="text-caption text-muted">
            Nguồn: {result.source} · {formatDiagnosticTime(result.returnedAt)}
            {result.recordedByName ? ` · ${result.recordedByName}` : ""}
          </p>
        </section>
      ))}
    </Card>
  );
}
