"use client";

import { useState, useEffect } from "react";
import {
  X,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Globe,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AuditLogEntry } from "../types/auditLogTypes";

interface AuditLogDetailDrawerProps {
  isOpen: boolean;
  log: AuditLogEntry | null;
  onClose: () => void;
}

export function AuditLogDetailDrawer({
  isOpen,
  log,
  onClose,
}: AuditLogDetailDrawerProps) {
  const [isTechnicalExpanded, setIsTechnicalExpanded] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !log) return null;

  const isSuccess = log.result === "SUCCESS";
  const isFailed = log.result === "FAILED";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="audit-log-drawer-title"
      className="fixed inset-0 z-50 overflow-hidden"
    >
      {/* Backdrop */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Đóng chi tiết sự kiện"
        className="fixed inset-0 bg-brand-neutral/40 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onClose();
        }}
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-6">
        <aside
          aria-label="Chi tiết sự kiện nhật ký hệ thống"
          className="flex w-screen max-w-[540px] flex-col border-l border-border bg-surface text-foreground shadow-modal"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-border/60 px-6 pt-5 pb-4">
            <div className="space-y-0.5">
              <h2
                id="audit-log-drawer-title"
                className="text-title font-bold tracking-tight text-foreground"
              >
                Chi tiết sự kiện #{log.id}
              </h2>
              <p className="text-caption text-muted">{log.fullTimestamp}</p>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={onClose}
              className="text-muted hover:text-foreground -mr-1 -mt-1"
              aria-label="Đóng"
            >
              <X className="size-4" />
            </Button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            {/* Status Banner */}
            <div
              className={cn(
                "flex items-center justify-between rounded-app-xl border p-3.5",
                isSuccess
                  ? "border-success/20 bg-success-bg/50"
                  : isFailed
                  ? "border-destructive/20 bg-destructive/5"
                  : "border-border bg-background/60"
              )}
            >
              <div className="flex items-center gap-2.5">
                {isSuccess ? (
                  <CheckCircle2 className="size-4.5 text-success shrink-0" />
                ) : isFailed ? (
                  <XCircle className="size-4.5 text-destructive shrink-0" />
                ) : (
                  <CheckCircle2 className="size-4.5 text-primary shrink-0" />
                )}
                <span className="text-body font-semibold text-foreground">
                  {log.action}
                </span>
              </div>

              <span
                className={cn(
                  "text-caption font-semibold",
                  isSuccess
                    ? "text-success"
                    : isFailed
                    ? "text-destructive"
                    : "text-foreground"
                )}
              >
                {log.resultLabel}
              </span>
            </div>

            {/* Section 1: Thông tin sự kiện */}
            <div className="space-y-3">
              <h3 className="text-body font-bold text-foreground">
                Thông tin sự kiện
              </h3>

              <div className="space-y-2.5 text-caption">
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-muted">Người thực hiện</span>
                  <span className="font-semibold text-foreground">
                    {log.executor}
                  </span>
                </div>

                <div className="flex items-center justify-between py-0.5">
                  <span className="text-muted">Vai trò</span>
                  <span className="font-medium text-foreground">
                    {log.executorRole}
                  </span>
                </div>

                <div className="flex items-center justify-between py-0.5">
                  <span className="text-muted">Đối tượng</span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <span
                      className={cn(
                        "font-bold",
                        log.isTargetDanger ? "text-destructive" : "text-primary"
                      )}
                    >
                      {log.target}
                    </span>
                    {log.targetDescription && (
                      <span className="text-foreground">
                        · {log.targetDescription}
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between py-0.5">
                  <span className="text-muted">Mã hành động</span>
                  <span className="font-mono font-bold tracking-wide text-foreground">
                    {log.actionCode}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: Dữ liệu thay đổi */}
            <div className="space-y-3">
              <h3 className="text-body font-bold text-foreground">
                Dữ liệu thay đổi
              </h3>

              {log.dataChanges && log.dataChanges.length > 0 ? (
                <div className="space-y-2.5">
                  {log.dataChanges.map((change, idx) => (
                    <div
                      key={idx}
                      className="rounded-app-xl border border-border/80 bg-background/60 p-3.5 space-y-2"
                    >
                      <div className="text-caption font-semibold text-foreground">
                        {change.field}
                      </div>

                      <div className="flex items-center justify-between gap-2 text-caption">
                        <span className="font-mono text-muted">
                          {change.before}
                        </span>

                        <ArrowRight className="size-3.5 text-muted shrink-0" />

                        <span
                          className={cn(
                            "font-mono font-bold text-right",
                            change.isHighlighted
                              ? isSuccess
                                ? "text-success"
                                : isFailed
                                ? "text-destructive"
                                : "text-primary"
                              : "text-foreground"
                          )}
                        >
                          {change.after}
                        </span>
                      </div>
                    </div>
                  ))}

                  <p className="text-label text-muted">
                    Hiển thị các trường trước/sau được ghi nhận trong sự kiện.
                  </p>
                </div>
              ) : (
                <div className="rounded-app-xl border border-dashed border-border bg-background/40 p-3.5 text-center text-caption text-muted">
                  Không có thay đổi dữ liệu cấu trúc trong sự kiện này.
                </div>
              )}
            </div>

            {/* Section 3: Lý do / Nội dung ghi nhận */}
            <div className="space-y-2.5">
              <h3 className="text-body font-bold text-foreground">
                Lý do / Nội dung ghi nhận
              </h3>

              <div className="rounded-app-xl border border-border bg-background/60 p-3.5 text-caption text-foreground/90 leading-relaxed min-h-[58px]">
                {log.reason || "Nội dung được ghi thực tế trong bản ghi Audit Log, nếu có."}
              </div>
            </div>

            {/* Section 4: Thông tin kỹ thuật (Collapsible) */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setIsTechnicalExpanded((prev) => !prev)}
                className="flex w-full items-center gap-1.5 text-body font-semibold text-foreground hover:text-primary transition-colors cursor-pointer select-none"
              >
                {isTechnicalExpanded ? (
                  <ChevronDown className="size-4 text-muted" />
                ) : (
                  <ChevronRight className="size-4 text-muted" />
                )}
                <span>Thông tin kỹ thuật</span>
              </button>

              {isTechnicalExpanded && (
                <div className="mt-3 rounded-app-xl border border-border bg-background/60 p-3.5 space-y-2.5 text-caption">
                  <div className="flex items-center justify-between gap-3 py-0.5">
                    <span className="text-muted flex items-center gap-1.5">
                      <Globe className="size-3.5 text-muted" />
                      Địa chỉ IP
                    </span>
                    <span className="font-mono font-semibold text-foreground">
                      {log.technicalInfo?.ipAddress || "113.161.42.19"}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-3 py-0.5">
                    <span className="text-muted shrink-0">User Agent</span>
                    <span className="text-right text-label font-mono text-muted break-all">
                      {log.technicalInfo?.userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 py-0.5">
                    <span className="text-muted">Mã yêu cầu (Request ID)</span>
                    <span className="font-mono text-label text-foreground">
                      {log.technicalInfo?.requestId || "req_98a72b14c"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 py-0.5">
                    <span className="text-muted">Phiên làm việc (Session ID)</span>
                    <span className="font-mono text-label text-foreground">
                      {log.technicalInfo?.sessionId || "sess_842af91c"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 py-0.5">
                    <span className="text-muted flex items-center gap-1.5">
                      <Terminal className="size-3.5 text-muted" />
                      Endpoint
                    </span>
                    <span className="font-mono text-label font-semibold text-primary">
                      {log.technicalInfo?.endpoint || "POST /api/v1/schedules/approve"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end border-t border-border bg-surface px-6 py-4">
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={onClose}
              className="border-border bg-surface px-6 font-semibold text-foreground hover:bg-item-hover shadow-xs"
            >
              Đóng
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
