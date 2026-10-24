"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { getInitials } from "@/lib/utils";
import toast from "react-hot-toast";
import {
  useApproveScheduleRequestMutation,
  useRejectScheduleRequestMutation,
} from "../../services/approvalsApi";
import { Check, Calendar, Clock, UserCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import type { ApprovalRequest } from "../../types/approvalTypes";

interface RequestApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: ApprovalRequest | null;
}

export function RequestApprovalModal({
  isOpen,
  onClose,
  request,
}: RequestApprovalModalProps) {
  const [approveRequest, { isLoading: isApproving, reset: resetApprove }] =
    useApproveScheduleRequestMutation();
  const [rejectRequest, { isLoading: isRejecting, reset: resetReject }] =
    useRejectScheduleRequestMutation();
  const { register, handleSubmit, reset } = useForm<{ notes: string }>({
    defaultValues: { notes: "" },
  });
  const isSubmitting = isApproving || isRejecting;
  const canReview =
    request?.status === "PENDING" || request?.status === "URGENT";

  useEffect(() => {
    if (isOpen) {
      reset({ notes: request?.notes ?? "" });
      resetApprove();
      resetReject();
    }
  }, [isOpen, request, reset, resetApprove, resetReject]);

  const handleDecision = async (
    decision: "APPROVE" | "REJECT",
    values: { notes: string },
  ) => {
    if (!request || !canReview || isSubmitting) return;
    const input = { id: request.id, notes: values.notes.trim() };
    try {
      const result = await (
        decision === "APPROVE" ? approveRequest(input) : rejectRequest(input)
      ).unwrap();
      toast.success(result.message);
      onClose();
    } catch {
      toast.error("Không thể xử lý yêu cầu. Vui lòng thử lại.");
    }
  };

  if (!request) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !isSubmitting && onClose()}
      disablePointerDismissal={isSubmitting}
    >
      <DialogContent className="max-w-[620px]" showCloseButton={!isSubmitting}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="font-mono text-caption font-bold text-primary">
              {request.requestCode}
            </span>
            <span className="text-muted">•</span>
            <span className="font-mono text-caption text-muted">
              {request.doctorCode}
            </span>
            {request.isUrgent && (
              <Badge variant="danger" size="sm" shape="pill">
                Khẩn cấp
              </Badge>
            )}
          </div>
          <DialogTitle>Xử lý yêu cầu: {request.typeName}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((values) => handleDecision("APPROVE", values))}
          aria-busy={isSubmitting}
        >
          <div className="flex flex-col gap-4 p-5 sm:p-6">
            <div className="flex items-center gap-3 rounded-app-md border border-border bg-secondary/30 p-3.5">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary text-body font-bold text-primary-foreground shadow-2xs">
                {getInitials(request.doctorName)}
              </div>
              <div className="flex flex-col">
                <span className="text-body font-bold text-foreground">
                  {request.doctorName}
                </span>
                <span className="text-caption text-muted">
                  {request.specialtyName}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-app-md border border-border bg-surface p-3">
                <div className="flex items-center gap-1.5 text-caption font-medium text-muted">
                  <Calendar className="size-3.5" />
                  <span>Ngày áp dụng</span>
                </div>
                <span className="mt-1 block text-body font-semibold text-foreground">
                  {request.date}
                </span>
              </div>

              <div className="rounded-app-md border border-border bg-surface p-3">
                <div className="flex items-center gap-1.5 text-caption font-medium text-muted">
                  <Clock className="size-3.5" />
                  <span>Ca trực yêu cầu</span>
                </div>
                <span className="mt-1 block text-body font-semibold text-foreground">
                  {request.shiftTime}
                </span>
              </div>
            </div>
            {request.targetDoctorName && (
              <div className="flex items-center gap-2.5 rounded-app-md border border-warning/30 bg-warning-bg p-3 text-caption text-foreground">
                <UserCheck className="size-4 text-warning shrink-0" />
                <span>
                  Bác sĩ nhận trực thay:{" "}
                  <strong>{request.targetDoctorName}</strong> (Đã đồng thuận
                  trực thế).
                </span>
              </div>
            )}
            <div className="flex flex-col gap-1 rounded-app-md border border-border bg-secondary/20 p-3.5">
              <span className="text-label font-semibold text-muted uppercase tracking-wider">
                Lý do gửi yêu cầu:
              </span>
              <p className="text-body text-foreground">{request.reason}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="admin-notes"
                className="text-caption font-semibold text-foreground"
              >
                Ghi chú của Quản trị viên (nếu có):
              </label>
              <Textarea
                id="admin-notes"
                rows={2}
                {...register("notes")}
                disabled={isSubmitting || !canReview}
                placeholder="Nhập phản hồi hoặc ghi chú lưu lại vào nhật ký hệ thống..."
              />
            </div>
          </div>

          <DialogFooter className="justify-between sm:justify-between">
            <Button
              type="button"
              variant="destructive"
              onClick={handleSubmit((values) =>
                handleDecision("REJECT", values),
              )}
              disabled={isSubmitting || !canReview}
            >
              {isRejecting ? "Đang từ chối..." : "Từ chối yêu cầu"}
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Đóng
              </Button>
              <Button
                type="submit"
                variant="default"
                disabled={isSubmitting || !canReview}
              >
                <Check className="size-4" />
                <span>
                  {isApproving ? "Đang phê duyệt..." : "Phê duyệt yêu cầu"}
                </span>
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
