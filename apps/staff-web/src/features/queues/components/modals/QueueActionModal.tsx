"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { QUEUE_ACTION_LABELS, QUEUE_ERROR_MESSAGES } from "../../constants";
import {
  callQueueSession,
  restoreQueueSession,
  skipQueueSession,
} from "../../services/queuesService";
import type {
  QueueAction,
  QueueActionResponse,
  QueueItem,
} from "../../types/queueTypes";
import { getQueueErrorMessage } from "../../utils";

interface QueueActionModalProps {
  item: QueueItem;
  action: QueueAction;
  onClose: () => void;
  onRefresh: () => Promise<void>;
  onSuccess: (response: QueueActionResponse) => void;
}

const ACTION_REQUESTS = {
  CALL: callQueueSession,
  SKIP: skipQueueSession,
  RESTORE: restoreQueueSession,
};

export function QueueActionModal({
  item,
  action,
  onClose,
  onRefresh,
  onSuccess,
}: QueueActionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isCallDisabled = action === "CALL" && !item.canCall;

  const handleConfirm = async () => {
    if (isSubmitting || isCallDisabled) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await ACTION_REQUESTS[action](item.careSessionId);
      toast.success(`${QUEUE_ACTION_LABELS[action]} thành công`);
      onSuccess(response);
      onClose();
    } catch (error) {
      const message = getQueueErrorMessage(
        error,
        QUEUE_ERROR_MESSAGES.ACTION_FAILED,
      );
      setErrorMessage(message);
      toast.error(message);
      void onRefresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open
      onOpenChange={(isOpen) => !isOpen && !isSubmitting && onClose()}
      disablePointerDismissal={isSubmitting}
    >
      <DialogContent showCloseButton={false}>
        <DialogHeader className="flex-row items-center justify-between gap-4 bg-surface py-4">
          <DialogTitle>{QUEUE_ACTION_LABELS[action]}</DialogTitle>
          <Button
            type="button"
            variant="ghost"
            disabled={isSubmitting}
            onClick={onClose}
          >
            Đóng
          </Button>
        </DialogHeader>
        <div className="space-y-4 p-6">
          <div>
            <h3 className="text-heading font-bold text-foreground">
              {item.patientName}
            </h3>
            <p className="mt-1 text-caption text-muted">
              {item.patientCode} · STT {item.queueDisplayNumber ?? "—"}
            </p>
          </div>
          {action === "SKIP" && (
            <p className="text-body font-medium">
              Lần bỏ qua thứ {item.nextSkipCount}.{" "}
              {item.nextSkipCount >= 3
                ? "Lượt sẽ chuyển sang Vắng mặt."
                : "Lượt sẽ được gọi ngay khi bác sĩ khám xong bệnh nhân hiện tại."}
            </p>
          )}
          {action === "CALL" && (
            <p className="text-body text-muted">
              {item.room
                ? `Phòng khám ${item.room}`
                : "Xác nhận gọi bệnh nhân này vào khám."}
            </p>
          )}
          {action === "RESTORE" && (
            <p className="text-body text-muted">
              Lượt sẽ về trạng thái chờ và mất quyền ưu tiên bỏ qua. Số lần bỏ
              qua được giữ nguyên.
            </p>
          )}
          {isCallDisabled && (
            <p role="alert" className="text-caption text-danger">
              {item.cannotCallReason}
            </p>
          )}
          {errorMessage && (
            <p role="alert" className="text-caption text-danger">
              {errorMessage}
            </p>
          )}
          <DialogDescription>
            Kiểm tra thông tin bệnh nhân trước khi xác nhận thao tác.
          </DialogDescription>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            disabled={isSubmitting}
            onClick={onClose}
          >
            Hủy
          </Button>
          <Button
            type="button"
            disabled={isSubmitting || isCallDisabled}
            onClick={handleConfirm}
          >
            {isSubmitting ? "Đang xử lý..." : "Xác nhận"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
