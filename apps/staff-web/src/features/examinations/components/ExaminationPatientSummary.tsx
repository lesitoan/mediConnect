"use client";
import { AlertTriangle, Pencil } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import type { Examination } from "../types/examinationTypes";
export function ExaminationPatientSummary({
  item,
  onHistory,
  onRecords,
}: {
  item: Examination;
  onHistory: () => void;
  onRecords: () => void;
}) {
  return (
    <aside className="space-y-4">
      <Card className="p-4 shadow-none">
        <h2 className="text-base font-bold">{item.patientName}</h2>
        <p className="mt-1 text-caption text-muted">
          {item.patientCode} · {item.demographics}
        </p>
        <div className="mt-3 border-t border-border pt-3 text-caption leading-relaxed text-muted">
          <p className="mb-1 text-body text-foreground">{item.appointmentTime || "-"}</p>
          <p>
            Điện thoại: {item.phone || "-"} · CCCD: {item.nationalId || "-"} · BHYT:
            ?
          </p>
        </div>
      </Card>
      <Card className="border-2 border-error-border bg-error-bg/60 p-4 shadow-none">
        <h2 className="flex items-center gap-2 text-label font-bold uppercase text-error-text">
          <AlertTriangle className="size-4" />
          Dị ứng & chống chỉ định
        </h2>
        <p className="mt-2 text-body font-bold text-error-text">
          {item.allergy}
        </p>
        <p className="mt-2 text-caption leading-relaxed text-muted">
          {item.allergy === "Chưa ghi nhận"
            ? "Xác nhận thông tin dị ứng theo hồ sơ."
            : item.allergyDetails || ""}
        </p>
        {item.allergy !== "Chưa ghi nhận" && (
          <span className="mt-3 inline-block rounded-app-sm bg-danger-bg px-2 py-1 text-label font-bold text-danger">
            Cực kỳ nghiêm trọng
          </span>
        )}
      </Card>
      <Card className="p-4 shadow-none">
        <div className="flex items-center justify-between">
          <h2 className="text-body font-bold">Tiền sử y khoa</h2>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Cập nhật tiền sử"
            disabled={item.status !== "IN_PROGRESS" || item.isLocked === true}
            onClick={onHistory}
          >
            <Pencil className="size-3 text-muted" />
          </Button>
        </div>
        <p className="mt-2 text-caption font-medium">{item.history}</p>
        <p className="mt-1 text-label text-muted">
          Trạng thái xác nhận theo hồ sơ (Đã xác nhận)
        </p>
        <div className="mt-3 border-t border-border pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-auto px-0 text-caption font-medium text-primary"
            disabled={item.status !== "IN_PROGRESS" || item.isLocked === true}
            onClick={onHistory}
          >
            Cập nhật / Xác nhận tiền sử →
          </Button>
        </div>
      </Card>
      <Card className="p-4 shadow-none">
        <h2 className="text-body font-bold">Lịch sử khám gần đây</h2>
        <p className="mt-1 text-caption text-muted">
          Các lần khám trước theo hồ sơ
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="mt-4 h-auto px-0 text-caption font-medium text-primary"
          onClick={onRecords}
        >
          Xem hồ sơ & Lịch sử khám →
        </Button>
      </Card>
    </aside>
  );
}
