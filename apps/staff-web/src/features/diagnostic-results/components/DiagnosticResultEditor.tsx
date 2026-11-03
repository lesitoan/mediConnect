"use client";
import { useState } from "react";
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
import { useGetAuthUserQuery } from "@/features/auth/services/authApi";
import { useDiagnosticPreview } from "../hooks/useDiagnosticPreview";
import {
  appendDiagnosticImages,
  completeDiagnosticOrder,
  receiveDiagnosticOrder,
  removeDiagnosticImage,
  updateDiagnosticConclusion,
} from "../services/diagnosticPreviewStore";
import {
  DIAGNOSTIC_CATEGORY_LABELS,
  DIAGNOSTIC_STATUS_LABELS,
  type DiagnosticImage,
} from "../types/diagnosticTypes";
import {
  getCompletionError,
  validateDiagnosticFiles,
} from "../diagnosticUtils";
import { DiagnosticImageGallery } from "./DiagnosticImageGallery";

export function DiagnosticResultEditor({
  orderId,
  onClose,
  onViewRecord,
}: {
  orderId: string;
  onClose: () => void;
  onViewRecord: (sessionId: string) => void;
}) {
  const order = useDiagnosticPreview().find((order) => order.id === orderId);
  const { data: user } = useGetAuthUserQuery();
  const [isUploading, setIsUploading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState("");
  if (!order) return null;
  const isReadOnly = order.status !== "IN_PROGRESS";
  const completionError = getCompletionError(order);
  const addImages = async (files: File[]) => {
    const invalid = validateDiagnosticFiles(files, order.images.length);
    if (invalid) {
      setError(invalid);
      return;
    }
    setIsUploading(true);
    setError("");
    const images: DiagnosticImage[] = [];
    try {
      for (const file of files) {
        const bitmap = await createImageBitmap(file);
        bitmap.close();
        images.push({
          id: crypto.randomUUID(),
          url: URL.createObjectURL(file),
          name: file.name,
          size: file.size,
        });
      }
      appendDiagnosticImages(orderId, images);
    } catch {
      images.forEach((image) => URL.revokeObjectURL(image.url));
      setError(
        "Không thể đọc ảnh. Chọn ảnh JPG, PNG hoặc WebP hợp lệ và thử lại.",
      );
    } finally {
      setIsUploading(false);
    }
  };
  const complete = () => {
    try {
      completeDiagnosticOrder(orderId, user?.name || "Nhân viên trả kết quả");
      setIsConfirming(false);
      toast.success("Đã hoàn tất kết quả minh họa.");
    } catch (error) {
      setIsConfirming(false);
      setError(
        error instanceof Error ? error.message : "Không thể hoàn tất kết quả.",
      );
    }
  };
  return (
    <Drawer
      open
      onOpenChange={(open) => {
        if (!open && !isUploading && !isConfirming) onClose();
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
            {order.visit.patientName} · {order.visit.patientCode} · Phiên{" "}
            {order.visit.examinationCode}
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
              {order.serviceCode} · {order.visit.demographics} · Phòng khám{" "}
              {order.visit.room}
            </p>
            <dl className="mt-4 space-y-2 text-body">
              <div>
                <dt className="text-muted">Lý do chỉ định</dt>
                <dd>{order.visit.reason || "Chưa ghi nhận"}</dd>
              </div>
              {order.visit.instructions && (
                <div>
                  <dt className="text-muted">Lưu ý thực hiện</dt>
                  <dd className="whitespace-pre-wrap">
                    {order.visit.instructions}
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
                      disabled={isUploading}
                      onChange={(event) => {
                        const files = Array.from(event.target.files ?? []);
                        event.target.value = "";
                        if (files.length) void addImages(files);
                      }}
                    />
                  </label>
                )}
                {isUploading && (
                  <p role="status" className="text-body text-primary">
                    Đang đọc ảnh...
                  </p>
                )}
                <DiagnosticImageGallery
                  images={order.images}
                  disabled={isUploading}
                  onRemove={
                    isReadOnly
                      ? undefined
                      : (id) => removeDiagnosticImage(orderId, id)
                  }
                />
                {!order.images.length && (
                  <p className="text-body text-muted">Chưa có ảnh đính kèm.</p>
                )}
              </section>
              <label className="block space-y-2 text-body font-semibold">
                Nhận xét / Kết luận
                <Textarea
                  value={order.conclusion}
                  readOnly={isReadOnly}
                  disabled={isUploading}
                  rows={5}
                  maxLength={10000}
                  className="read-only:bg-neutral-bg read-only:text-muted"
                  placeholder="Nhập nhận xét hoặc kết luận kèm ảnh kết quả..."
                  onChange={(event) =>
                    updateDiagnosticConclusion(orderId, event.target.value)
                  }
                />
              </label>
              {!isReadOnly && (
                <p className="text-caption text-muted">
                  Bản nháp được giữ khi đổi chỉ định. Chỉ kết quả đã hoàn tất
                  mới hiện trong hồ sơ khám.
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
          <Button variant="outline" disabled={isUploading} onClick={onClose}>
            Đóng
          </Button>
          {order.status === "WAITING" ? (
            <Button onClick={() => receiveDiagnosticOrder(orderId)}>
              Tiếp nhận chỉ định
            </Button>
          ) : order.status === "COMPLETED" ? (
            <Button onClick={() => onViewRecord(order.visit.careSessionId)}>
              Xem trong hồ sơ khám
            </Button>
          ) : (
            <Button
              disabled={isUploading || !!completionError}
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
                {order.visit.patientName} · {order.visit.patientCode}
              </p>
              <p>Phiên khám: {order.visit.examinationCode}</p>
              <p>
                {order.service} · {order.images.length} ảnh
              </p>
              <p className="text-muted">
                Kết quả sẽ được hiển thị trong hồ sơ đúng phiên khám này. Bản
                minh họa chưa ghi dữ liệu vào hệ thống.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsConfirming(false)}>
                Kiểm tra lại
              </Button>
              <Button onClick={complete}>Xác nhận hoàn tất</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DrawerContent>
    </Drawer>
  );
}
