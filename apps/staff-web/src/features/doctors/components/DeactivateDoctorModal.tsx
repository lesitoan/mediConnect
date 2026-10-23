"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type {
  Doctor,
  AppointmentHandlingStrategy,
  DeactivateDoctorInput,
} from "../types/doctorTypes";

interface DeactivateDoctorModalProps {
  doctor: Doctor | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: DeactivateDoctorInput) => void;
}

export function DeactivateDoctorModal({
  doctor,
  isOpen,
  onClose,
  onConfirm,
}: DeactivateDoctorModalProps) {
  const [strategy, setStrategy] =
    useState<AppointmentHandlingStrategy>("REASSIGN");
  const [reason, setReason] = useState("");

  if (!doctor) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    onConfirm({
      doctorId: doctor.id,
      strategy,
      reason: reason.trim(),
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[620px] p-0">
        <DialogHeader className="flex-col items-start gap-1 p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-app-xl bg-warning-bg text-warning">
              <AlertTriangle className="size-6" />
            </div>
            <DialogTitle className="text-heading font-bold text-foreground sm:text-title">
              Tạm dừng hoạt động & Khóa tiếp nhận bác sĩ
            </DialogTitle>
          </div>

          <DialogDescription className="mt-2 text-caption text-muted">
            Bạn đang thực hiện tạm dừng hoạt động đối với{" "}
            <span className="font-bold text-foreground">{doctor.name}</span> (
            <span className="font-semibold text-primary">{doctor.code}</span>) - Khoa{" "}
            <span className="font-medium text-foreground">
              {doctor.specialtyName}
            </span>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 p-6 pt-0">
          <div className="flex items-start gap-3 rounded-app-xl border border-warning/20 bg-warning-bg p-3.5 text-caption text-warning">
            <AlertTriangle className="size-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold">
                Lưu ý đặc biệt về lịch hẹn:
              </div>
              <div>
                Bác sĩ hiện đang có{" "}
                <span className="font-bold">
                  {doctor.weeklyAppointments} lịch hẹn
                </span>{" "}
                bệnh nhân đã đặt trước trong tuần này. Vui lòng chọn phương án xử lý trước khi xác nhận:
              </div>
            </div>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-caption font-semibold text-foreground">
              Phương án điều phối lịch hẹn <span className="text-destructive">*</span>
            </legend>

            <label
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-app-xl border p-3.5 transition-colors",
                strategy === "REASSIGN"
                  ? "border-primary/40 bg-primary-light"
                  : "border-border bg-surface hover:bg-item-hover"
              )}
            >
              <input
                type="radio"
                name="handling-strategy"
                value="REASSIGN"
                checked={strategy === "REASSIGN"}
                onChange={() => setStrategy("REASSIGN")}
                className="mt-0.5 size-4 accent-primary"
              />
              <div className="flex-1 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-caption font-semibold text-foreground">
                    Tự động điều phối sang bác sĩ cùng chuyên khoa
                  </span>
                  <Badge variant="default" className="text-[10px] font-bold">
                    Khuyến nghị
                  </Badge>
                </div>
                <p className="text-caption text-muted">
                  Hệ thống tự động chuyển {doctor.weeklyAppointments} bệnh nhân sang các bác sĩ khả dụng thuộc Khoa {doctor.specialtyName} và gửi SMS thông báo.
                </p>
              </div>
            </label>

            <label
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-app-xl border p-3.5 transition-colors",
                strategy === "CANCEL"
                  ? "border-primary/40 bg-primary-light"
                  : "border-border bg-surface hover:bg-item-hover"
              )}
            >
              <input
                type="radio"
                name="handling-strategy"
                value="CANCEL"
                checked={strategy === "CANCEL"}
                onChange={() => setStrategy("CANCEL")}
                className="mt-0.5 size-4 accent-primary"
              />
              <div className="space-y-0.5">
                <span className="text-caption font-semibold text-foreground">
                  Hủy lịch hẹn và gửi thông báo hoàn phí / đổi ngày
                </span>
                <p className="text-caption text-muted">
                  Gửi thông báo hủy kèm link đổi lịch ưu tiên và hướng dẫn hoàn tiền viện phí đã thanh toán.
                </p>
              </div>
            </label>
          </fieldset>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="deactivate-reason"
                className="text-caption font-semibold text-foreground"
              >
                Lý do tạm dừng hoạt động <span className="text-destructive">*</span>
              </label>
              <span className="text-label text-muted">Bắt buộc</span>
            </div>
            <Textarea
              id="deactivate-reason"
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do tạm dừng (Nghỉ thai sản, đi công tác đột xuất, chấm dứt hợp đồng...)"
              className="bg-background text-caption"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={onClose}
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="default"
            >
              Xác nhận tạm dừng
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
