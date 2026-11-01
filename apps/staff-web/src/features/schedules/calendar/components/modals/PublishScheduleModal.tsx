"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";
import { CheckCircle2, Send } from "lucide-react";
import { usePublishSchedulesMutation } from "../../services/schedulesApi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/button";

interface PublishScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleIds: string[];
}

export function PublishScheduleModal({
  isOpen,
  onClose,
  scheduleIds,
}: PublishScheduleModalProps) {
  const [publishSchedules, { isLoading: isSubmitting, reset }] =
    usePublishSchedulesMutation();

  useEffect(() => {
    if (isOpen) reset();
  }, [isOpen, reset]);

  const handleConfirm = async () => {
    if (isSubmitting || scheduleIds.length === 0) return;
    try {
      const result = await publishSchedules(scheduleIds).unwrap();
      toast.success(`Đã công bố ${result.publishedCount} quy tắc lịch.`);
      onClose();
    } catch {
      toast.error(
        "Không thể công bố đầy đủ lịch. Hãy kiểm tra trạng thái từng lịch rồi thử lại.",
      );
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
            <div className="flex size-8 items-center justify-center rounded-app-md border border-success/20 bg-success-bg text-success">
              <Send className="size-4" />
            </div>
            <DialogTitle>Công bố lịch lặp</DialogTitle>
          </div>
          <DialogDescription>
            Công bố {scheduleIds.length} quy tắc lịch nháp trong khoảng ngày
            đang xem. Lịch được áp dụng theo ngày trong tuần và mở các lượt khám
            cho bệnh nhân đặt lịch.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-2.5 rounded-app-md border border-success/30 bg-success-bg p-3.5 text-caption text-foreground">
          <CheckCircle2 className="mt-0.5 size-4.5 shrink-0 text-success" />
          <span>
            Mỗi quy tắc sẽ được công bố riêng và tạo các lượt khám phù hợp với
            ngày, giờ và thời lượng đã cấu hình.
          </span>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={handleConfirm}
            disabled={isSubmitting || scheduleIds.length === 0}
          >
            {isSubmitting
              ? "Đang công bố..."
              : `Công bố ${scheduleIds.length} lịch`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
