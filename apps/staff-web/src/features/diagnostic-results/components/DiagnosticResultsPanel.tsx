"use client";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { LabResult } from "@/features/examinations/types/examinationTypes";
import { formatDiagnosticTime } from "../diagnosticUtils";
import { DiagnosticImageGallery } from "./DiagnosticImageGallery";

export function DiagnosticResultsPanel({ serverResults = [] }: { careSessionId: string; serverResults?: readonly LabResult[] }) {
  return <Card className="space-y-4 p-5 shadow-none"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-heading font-bold">Kết quả cận lâm sàng</h2><Badge variant={serverResults.length ? "success" : "neutral"}>{serverResults.length} kết quả đã trả</Badge></div>{!serverResults.length && <div className="rounded-app-lg border border-dashed border-border-strong bg-background p-5 text-center text-body text-muted">Chưa có kết quả được trả về cho phiên khám này.</div>}{serverResults.map((result, index) => <section key={result.orderRef + index} className="space-y-2 rounded-app-lg border border-border p-4"><h3 className="text-body font-bold">{result.orderRef}</h3><p className="whitespace-pre-wrap text-body">{result.result}</p><DiagnosticImageGallery images={(result.images ?? []).map((image) => ({ ...image, id: image.publicId, size: 0 }))} /><p className="text-caption text-muted">Nguồn: {result.source} · {formatDiagnosticTime(result.returnedAt)}</p></section>)}</Card>;
}
