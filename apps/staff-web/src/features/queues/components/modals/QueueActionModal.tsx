"use client";

import toast from "react-hot-toast";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import {
  QUEUE_ACTION_CONTENT,
  QUEUE_ERROR_MESSAGES,
  QUEUE_STATUS_LABELS,
  QUEUE_TRANSITIONS,
} from "../../constants";
import { useUpdateQueueItemMutation } from "../../services/queuesApi";
import type { QueueActionInput, QueueItem } from "../../types/queueTypes";
import { getQueueErrorMessage } from "../../utils";

interface QueueActionModalProps {
  item: QueueItem;
  input: QueueActionInput;
  onClose: () => void;
}

export function QueueActionModal({
  item,
  input,
  onClose,
}: QueueActionModalProps) {
  const [updateQueueItem, { isLoading: isSubmitting }] =
    useUpdateQueueItemMutation();
  const content = QUEUE_ACTION_CONTENT[input.action];
  const canSubmit =
    item.status === input.expectedStatus &&
    item.status === QUEUE_TRANSITIONS[input.action].from;

  const handleConfirm = async () => {
    if (!canSubmit || isSubmitting) return;
    try {
      await updateQueueItem(input).unwrap();
      toast.success(content.successMessage);
      onClose();
    } catch (error) {
      toast.error(
        getQueueErrorMessage(error, QUEUE_ERROR_MESSAGES.UPDATE_FAILED),
      );
    }
  };

  return (
    <Dialog
      open
      onOpenChange={(isOpen) => !isOpen && !isSubmitting && onClose()}
      disablePointerDismissal={isSubmitting}
    >
      <DialogContent
        className={
          input.action === "CALL"
            ? "max-h-[90dvh] max-w-[480px] overflow-y-auto"
            : "max-h-[90dvh] max-w-[448px] overflow-y-auto"
        }
        showCloseButton={false}
      >
        <DialogHeader className="flex-row items-center justify-between gap-4 bg-surface py-4">
          <DialogTitle className="leading-snug">{content.title}</DialogTitle>
          <Button
            type="button"
            variant="ghost"
            className="shrink-0 text-body text-muted"
            disabled={isSubmitting}
            onClick={onClose}
          >
            Đóng
          </Button>
        </DialogHeader>
        <div className="space-y-5 p-6">
          {input.action === "SKIP" && (
            <p className="text-body font-medium text-foreground">
              Xác nhận bỏ qua lượt của bệnh nhân:
            </p>
          )}
          <div
            className={
              input.action === "SKIP"
                ? "rounded-app-xl border border-border/60 bg-background p-4"
                : "flex items-start justify-between gap-3"
            }
          >
            <div>
              <h3 className="text-heading font-bold text-foreground">
                {item.patientName}
              </h3>
              <p className="mt-1 text-caption font-medium text-muted">
                STT {item.queueNumber} ·{" "}
                {input.action === "CALL"
                  ? `${item.appointmentStart}–${item.appointmentEnd}`
                  : QUEUE_STATUS_LABELS[item.status]}
              </p>
            </div>
            {input.action === "CALL" && (
              <Badge
                variant="secondary"
                shape="pill"
                className="shrink-0 px-2.5 py-1 text-label"
              >
                {QUEUE_STATUS_LABELS[item.status]}
              </Badge>
            )}
          </div>
          {input.action === "CALL" && (
            <dl className="border-t border-border/60 pt-4">
              <div className="flex justify-between gap-4 text-body">
                <dt className="text-muted">Phòng khám</dt>
                <dd className="font-bold text-foreground">{item.room}</dd>
              </div>
            </dl>
          )}
          {input.action === "RESTORE" && (
            <dl className="space-y-3 border-t border-border/60 pt-4 text-body">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Trạng thái hiện tại</dt>
                <dd className="font-semibold">
                  {QUEUE_STATUS_LABELS[item.status]}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Sau khi xác nhận</dt>
                <dd className="font-semibold text-primary">Đang chờ</dd>
              </div>
            </dl>
          )}
          <DialogDescription
            className={
              input.action === "SKIP"
                ? "text-caption leading-relaxed text-muted"
                : "rounded-app-xl border border-border/60 bg-background p-3.5 text-caption leading-relaxed"
            }
          >
            {content.description}
          </DialogDescription>
          {!canSubmit && (
            <p role="alert" className="text-caption text-danger">
              {QUEUE_ERROR_MESSAGES.STATUS_CHANGED_HINT}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            className="h-10 rounded-app-xl px-4 text-body"
            disabled={isSubmitting}
            onClick={onClose}
          >
            Hủy bỏ
          </Button>
          <Button
            type="button"
            className="h-10 rounded-app-xl px-5 text-body"
            disabled={isSubmitting || !canSubmit}
            onClick={handleConfirm}
          >
            {isSubmitting ? "Đang xử lý..." : content.confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
