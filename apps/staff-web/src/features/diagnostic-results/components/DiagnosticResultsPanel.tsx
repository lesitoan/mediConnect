"use client";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { LabResult } from "@/features/examinations/types/examinationTypes";
import { useDiagnosticPreview } from "../hooks/useDiagnosticPreview";
import {
  formatDiagnosticTime,
  getPublishedDiagnosticResults,
} from "../diagnosticUtils";
import { DiagnosticImageGallery } from "./DiagnosticImageGallery";
export function DiagnosticResultsPanel({
  careSessionId,
  serverResults = [],
}: {
  careSessionId: string;
  serverResults?: readonly LabResult[];
}) {
  const orders = useDiagnosticPreview();
  const results = getPublishedDiagnosticResults(orders, careSessionId);
  const pending = orders.filter(
    (order) =>
      order.visit.careSessionId === careSessionId &&
      order.status !== "COMPLETED",
  ).length;
  return (
    <Card className="space-y-4 p-5 shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-heading font-bold">Kết quả cận lâm sàng</h2>
        <Badge
          variant={
            results.length + serverResults.length ? "success" : "neutral"
          }
        >
          {results.length + serverResults.length} kết quả đã trả
        </Badge>
      </div>
      {pending > 0 && (
        <p className="text-body text-muted">
          Còn {pending} chỉ định chưa hoàn tất. Ảnh và nhận xét còn nháp chưa
          hiển thị trong hồ sơ.
        </p>
      )}
      {!results.length && !serverResults.length && (
        <div className="rounded-app-lg border border-dashed border-border-strong bg-background p-5 text-center text-body text-muted">
          Chưa có kết quả được trả về cho phiên khám này.
        </div>
      )}
      {results.map((order) => (
        <section
          key={order.id}
          className="space-y-3 rounded-app-lg border border-border p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-body font-bold">{order.service}</h3>
            <Badge variant="success">Đã hoàn tất</Badge>
          </div>
          <p className="whitespace-pre-wrap text-body">{order.conclusion}</p>
          <DiagnosticImageGallery images={order.images} />
          <p className="text-caption text-muted">
            Trả lúc{" "}
            {order.completedAt ? formatDiagnosticTime(order.completedAt) : "—"}{" "}
            · {order.recordedBy} · Kết quả minh họa
          </p>
        </section>
      ))}
      {serverResults.map((result, index) => (
        <section
          key={result.orderRef + index}
          className="space-y-2 rounded-app-lg border border-border p-4"
        >
          <h3 className="text-body font-bold">{result.orderRef}</h3>
          <p className="whitespace-pre-wrap text-body">{result.result}</p>
          <p className="text-caption text-muted">
            Nguồn: {result.source} · {formatDiagnosticTime(result.returnedAt)}
          </p>
        </section>
      ))}
      {!!results.length && (
        <p className="text-caption text-muted">
          Ảnh minh họa chỉ được giữ trong tab hiện tại, chưa lưu vào bệnh án
          trên hệ thống.
        </p>
      )}
    </Card>
  );
}
