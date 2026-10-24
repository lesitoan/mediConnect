"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";
import { usePublishSchedulesMutation } from "../../services/schedulesApi";
import { Send, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/button";
import type { ScheduleDateRange } from "../../types/scheduleTypes";

interface PublishScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  draftCount: number;
  dateRange: ScheduleDateRange;
}

export function PublishScheduleModal({
  isOpen,
  onClose,
  draftCount,
  dateRange,
}: PublishScheduleModalProps) {
  const [publishSchedules, { isLoading: isSubmitting, reset }] =
    usePublishSchedulesMutation();

  useEffect(() => {
    if (isOpen) reset();
  }, [isOpen, reset]);

  const handleConfirm = async () => {
    if (isSubmitting || draftCount === 0) return;
    try {
      const result = await publishSchedules(dateRange).unwrap();
      toast.success(result.message);
      onClose();
    } catch {
      toast.error("Không thể công bố lịch. Vui lòng thử lại.");
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !isSubmitting && onClose()}
      disablePointerDismissal={isSubmitting}
    >
      <DialogContent className="max-w-[500px]" showCloseButton={!isSubmitting}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-app-md bg-success-bg text-success border border-success/20">
              <Send className="size-4" />
            </div>
            <DialogTitle>Công bố lịch</DialogTitle>
          </div>
          <DialogDescription>
            Hệ thống đang có <strong>{draftCount} ca trực nháp</strong> trong
            khoảng{" "}
            <strong>
              {dateRange.startDate.split("-").reverse().join("/")} –{" "}
              {dateRange.endDate.split("-").reverse().join("/")}
            </strong>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3.5 p-5 sm:p-6">
          <div className="rounded-app-md border border-success/30 bg-success-bg p-3.5 text-caption text-foreground flex items-start gap-2.5">
            <CheckCircle2 className="size-4.5 text-success shrink-0 mt-0.5" />
            <div className="flex flex-col">
              <span className="font-semibold text-foreground">
                Sau khi công bố:
              </span>
              <span className="text-muted text-caption mt-0.5">
                Các ca trực sẽ được mở chính thức trên ứng dụng người bệnh và
                cổng thông tin bệnh viện để bệnh nhân có thể đặt lịch hẹn khám.
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Hủy bỏ
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={handleConfirm}
            disabled={isSubmitting || draftCount === 0}
          >
            <Send className="size-4" />
            <span>
              {isSubmitting
                ? "Đang công bố..."
                : "Xác nhận công bố (" + draftCount + " ca)"}
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
