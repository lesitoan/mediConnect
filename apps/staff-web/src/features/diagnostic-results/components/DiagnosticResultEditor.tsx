"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/Drawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import {
  completeDiagnosticOrder,
  receiveDiagnosticOrder,
  removeDiagnosticResultFile,
  saveDiagnosticResultDraft,
  uploadDiagnosticResultFiles,
} from "../services/diagnosticResultsApi";
import {
  DIAGNOSTIC_CATEGORY_LABELS,
  DIAGNOSTIC_STATUS_LABELS,
  type DiagnosticOrder,
} from "../types/diagnosticTypes";
import {
  getCompletionError,
  validateDiagnosticFiles,
} from "../diagnosticUtils";
import { DiagnosticImageGallery } from "./DiagnosticImageGallery";

export function DiagnosticResultEditor({
  order,
  onClose,
  onViewRecord,
  onRefresh,
}: {
  order: DiagnosticOrder;
  onClose: () => void;
  onViewRecord: (sessionId: string) => void;
  onRefresh: () => Promise<void>;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState("");
  const [conclusion, setConclusion] = useState(order.conclusion);
  useEffect(() => {
    setConclusion(order.conclusion);
  }, [order.id, order.conclusion]);
  const isReadOnly = order.status !== "IN_PROGRESS";
  const completionError = getCompletionError({ ...order, conclusion });
  const persistDraft = async () => {
    if (isReadOnly || conclusion === order.conclusion)
      return order.expectedUpdatedAt;
    setError("");
    try {
      const updatedAt = await saveDiagnosticResultDraft(
        order.careSessionId,
        order.orderRef,
        conclusion,
        order.expectedUpdatedAt,
      );
      await onRefresh();
      return updatedAt;
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Không thể lưu bản nháp.",
      );
      throw error;
    }
  };
  const closeEditor = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await persistDraft();
      onClose();
    } catch {
      return;
    } finally {
      setIsSaving(false);
    }
  };
  const addImages = async (files: File[]) => {
    const invalid = validateDiagnosticFiles(files, order.images.length);
    if (invalid) {
      setError(invalid);
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      const expectedUpdatedAt = await persistDraft();
      await uploadDiagnosticResultFiles(
        order.careSessionId,
        order.orderRef,
        expectedUpdatedAt,
        files,
      );
      await onRefresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Không thể tải ảnh lên.",
      );
    } finally {
      setIsSaving(false);
    }
  };
  const receive = async () => {
    setIsSaving(true);
    setError("");
    try {
      await receiveDiagnosticOrder(
        order.careSessionId,
        order.orderRef,
        order.expectedUpdatedAt,
      );
      await onRefresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Không thể tiếp nhận chỉ định.",
      );
    } finally {
      setIsSaving(false);
    }
  };
  const removeImage = async (fileId: string) => {
    setIsSaving(true);
    setError("");
    try {
      const expectedUpdatedAt = await persistDraft();
      await removeDiagnosticResultFile(
        order.careSessionId,
        fileId,
        order.orderRef,
        expectedUpdatedAt,
      );
      await onRefresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Không thể xóa ảnh kết quả.",
      );
    } finally {
      setIsSaving(false);
    }
  };
  const complete = async () => {
    setIsSaving(true);
    setError("");
    try {
      const expectedUpdatedAt = await persistDraft();
      await completeDiagnosticOrder(
        order.careSessionId,
        order.orderRef,
        conclusion.trim(),
        "CLS",
        expectedUpdatedAt,
      );
      setIsConfirming(false);
      toast.success("Đã lưu và trả kết quả CLS.");
      await onRefresh();
    } catch (error) {
      setIsConfirming(false);
      setError(
        error instanceof Error ? error.message : "Không thể hoàn tất kết quả.",
      );
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <Drawer
      open
      onOpenChange={(open) => {
        if (!open && !isSaving && !isConfirming) void closeEditor();
      }}
    >
      <DrawerContent className="w-full max-w-3xl">
        <DrawerHeader>
          <DrawerTitle>
            {order.status === "COMPLETED"
              ? "Kết quả đã hoàn tất"
              : "Trả kết quả chỉ định"}
          </DrawerTitle>
          <DrawerDescription>
            {order.patientName} · {order.patientCode} · Phiên{" "}
            {order.examinationCode}
          </DrawerDescription>
        </DrawerHeader>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
          <div className="rounded-app-xl border border-border bg-background p-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="brand">
                {DIAGNOSTIC_CATEGORY_LABELS[order.category]}
              </Badge>
              <Badge
                variant={
                  order.status === "COMPLETED"
                    ? "success"
                    : order.status === "IN_PROGRESS"
                      ? "warning"
                      : "neutral"
                }
              >
                {DIAGNOSTIC_STATUS_LABELS[order.status]}
              </Badge>
            </div>
            <h2 className="text-title font-bold">{order.service}</h2>
            <p className="mt-1 text-caption text-muted">
              {order.serviceCode} · {order.demographics} · Phòng khám{" "}
              {order.room}
            </p>
            <dl className="mt-4 space-y-2 text-body">
              <div>
                <dt className="text-muted">Lý do chỉ định</dt>
                <dd>{order.reason || "Chưa ghi nhận"}</dd>
              </div>
              {order.instructions && (
                <div>
                  <dt className="text-muted">Lưu ý thực hiện</dt>
                  <dd className="whitespace-pre-wrap">
                    {order.instructions}
                  </dd>
                </div>
              )}
            </dl>
          </div>
          {order.status === "WAITING" ? (
            <div className="rounded-app-lg border border-dashed border-border-strong p-5 text-body text-muted">
              Tiếp nhận chỉ định để đính kèm ảnh và nhập kết quả.
            </div>
          ) : (
            <>
              <section className="space-y-3">
                <div>
                  <h3 className="text-heading font-bold">Ảnh kết quả</h3>
                  <p className="mt-1 text-caption text-muted">
                    JPG, PNG hoặc WebP. Tối đa 6 ảnh, mỗi ảnh không quá 5 MB.
                  </p>
                </div>
                {!isReadOnly && (
                  <label className="block space-y-2 rounded-app-xl border border-dashed border-border-strong bg-background p-4 text-body font-medium">
                    Chọn ảnh phiếu xét nghiệm / chụp chiếu
                    <Input
                      aria-label="Chọn ảnh kết quả"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      disabled={isSaving}
                      onChange={(event) => {
                        const files = Array.from(event.target.files ?? []);
                        event.target.value = "";
                        if (files.length) void addImages(files);
                      }}
                    />
                  </label>
                )}
                {isSaving && (
                  <p role="status" className="text-body text-primary">
                    Đang lưu thay đổi...
                  </p>
                )}
                <DiagnosticImageGallery
                  images={order.images}
                  careSessionId={order.careSessionId}
                  disabled={isSaving}
                  onRemove={
                    isReadOnly
                      ? undefined
                      : removeImage
                  }
                />
                {!order.images.length && (
                  <p className="text-body text-muted">Chưa có ảnh đính kèm.</p>
                )}
              </section>
              <label className="block space-y-2 text-body font-semibold">
                Nhận xét / Kết luận
                <Textarea
                  value={conclusion}
                  readOnly={isReadOnly}
                  disabled={isSaving}
                  rows={5}
                  maxLength={10000}
                  className="read-only:bg-neutral-bg read-only:text-muted"
                  placeholder="Nhập nhận xét hoặc kết luận kèm ảnh kết quả..."
                  onChange={(event) => setConclusion(event.target.value)}
                />
              </label>
              {!isReadOnly && (
                <p className="text-caption text-muted">
                  Chỉ kết quả đã hoàn tất mới hiển thị trong hồ sơ khám.
                </p>
              )}
            </>
          )}
          {error && (
            <p
              role="alert"
              className="rounded-app-lg bg-error-bg p-3 text-body text-error"
            >
              {error}
            </p>
          )}
          {!isReadOnly && completionError && (
            <p className="text-caption text-muted">{completionError}</p>
          )}
        </div>
        <DrawerFooter className="flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={isSaving}
            onClick={() => void closeEditor()}
          >
            Đóng
          </Button>
          {order.status === "WAITING" ? (
            <Button disabled={isSaving} onClick={() => void receive()}>
              {isSaving ? "Đang tiếp nhận..." : "Tiếp nhận chỉ định"}
            </Button>
          ) : order.status === "COMPLETED" ? (
            <Button onClick={() => onViewRecord(order.careSessionId)}>
              Xem trong hồ sơ khám
            </Button>
          ) : (
            <Button
              disabled={isSaving || !!completionError}
              onClick={() => setIsConfirming(true)}
            >
              Hoàn tất & Trả kết quả
            </Button>
          )}
        </DrawerFooter>
        <Dialog open={isConfirming} onOpenChange={setIsConfirming}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Xác nhận trả kết quả</DialogTitle>
              <DialogDescription>
                Đối chiếu đúng bệnh nhân và dịch vụ trước khi hoàn tất.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 p-5 text-body">
              <p className="font-bold">
                {order.patientName} · {order.patientCode}
              </p>
              <p>Phiên khám: {order.examinationCode}</p>
              <p>
                {order.service} · {order.images.length} ảnh
              </p>
              <p className="text-muted">
                Kết quả sẽ được lưu và hiển thị trong hồ sơ đúng phiên khám này.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsConfirming(false)}>
                Kiểm tra lại
              </Button>
              <Button disabled={isSaving} onClick={() => void complete()}>
                Xác nhận hoàn tất
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DrawerContent>
    </Drawer>
  );
}
