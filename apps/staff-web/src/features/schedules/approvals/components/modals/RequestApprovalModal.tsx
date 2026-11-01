"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { getInitials } from "@/lib/utils";
import toast from "react-hot-toast";
import {
  useGetApprovalRequestQuery,
  useGetLeaveImpactQuery,
  useGetReplacementSlotsQuery,
  useApproveScheduleRequestMutation,
  useProposeExceptionMutation,
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
import type {
  ApprovalRequest,
  ApprovalRequestDetails,
  LeaveImpact,
} from "../../types/approvalTypes";

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
  const [proposeException, { isLoading: isProposing }] =
    useProposeExceptionMutation();
  const { currentData: detailedRequest } = useGetApprovalRequestQuery(
    request?.id ?? "",
    { skip: !isOpen || !request },
  );
  const { currentData: impact } = useGetLeaveImpactQuery(request?.id ?? "", {
    skip: !isOpen || !request,
  });
  const activeRequest = detailedRequest ?? request;
  const { register, handleSubmit, reset } = useForm<{ notes: string }>({
    defaultValues: { notes: "" },
  });
  const isSubmitting = isApproving || isRejecting || isProposing;
  const canReview =
    activeRequest?.status === "PENDING" ||
    activeRequest?.status === "RESOLVING" ||
    activeRequest?.status === "URGENT";

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
    if (!activeRequest || !canReview || isSubmitting) return;
    try {
      if (decision === "APPROVE") {
        const result = await approveRequest({
          id: activeRequest.id,
        }).unwrap();
        toast.success(result.message);
        if (result.status !== "RESOLVING") onClose();
      } else {
        const result = await
          rejectRequest({
            id: activeRequest.id,
            notes: values.notes.trim(),
          }).unwrap();
        toast.success(result.message);
        onClose();
      }
    } catch {
      toast.error("Không thể xử lý yêu cầu. Vui lòng thử lại.");
    }
  };

  const handlePropose = async (
    exceptionId: string,
    resolution: "REASSIGNED" | "RESCHEDULED" | "CANCELLED",
    toDoctorId?: string,
    toSlotId?: string,
  ) => {
    if (!activeRequest) return;
    if (resolution !== "CANCELLED" && (!toDoctorId || !toSlotId)) {
      toast.error("Chọn bác sĩ và khung giờ trước khi gửi đề xuất.");
      return;
    }
    try {
      const result = await proposeException({
        exceptionId,
        resolution,
        ...(toDoctorId ? { toDoctorId } : {}),
        ...(toSlotId ? { toSlotId } : {}),
        ...(resolution === "CANCELLED"
          ? { reason: "Đề xuất hủy lịch do bác sĩ nghỉ." }
          : {}),
      }).unwrap();
      toast.success(result.message);
    } catch {
      toast.error("Không thể gửi đề xuất. Hãy kiểm tra slot thay thế.");
    }
  };

  if (!activeRequest) return null;

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
              {activeRequest.requestCode}
            </span>
            <span className="text-muted">•</span>
            <span className="font-mono text-caption text-muted">
              {activeRequest.doctorCode}
            </span>
            {activeRequest.isUrgent && (
              <Badge variant="danger" size="sm" shape="pill">
                Khẩn cấp
              </Badge>
            )}
          </div>
          <DialogTitle>Xử lý yêu cầu: {activeRequest.typeName}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((values) => handleDecision("APPROVE", values))}
          aria-busy={isSubmitting}
        >
          <div className="flex flex-col gap-4 p-5 sm:p-6">
            <div className="flex items-center gap-3 rounded-app-md border border-border bg-secondary/30 p-3.5">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary text-body font-bold text-primary-foreground shadow-2xs">
                {getInitials(activeRequest.doctorName)}
              </div>
              <div className="flex flex-col">
                <span className="text-body font-bold text-foreground">
                  {activeRequest.doctorName}
                </span>
                <span className="text-caption text-muted">
                  {activeRequest.specialtyName}
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
                  {activeRequest.date}
                </span>
              </div>

              <div className="rounded-app-md border border-border bg-surface p-3">
                <div className="flex items-center gap-1.5 text-caption font-medium text-muted">
                  <Clock className="size-3.5" />
                  <span>Ca trực yêu cầu</span>
                </div>
                <span className="mt-1 block text-body font-semibold text-foreground">
                  {activeRequest.shiftTime}
                </span>
              </div>
            </div>
            {activeRequest.targetDoctorName && (
              <div className="flex items-center gap-2.5 rounded-app-md border border-warning/30 bg-warning-bg p-3 text-caption text-foreground">
                <UserCheck className="size-4 text-warning shrink-0" />
                <span>
                  Bác sĩ nhận trực thay:{" "}
                  <strong>                  {activeRequest.targetDoctorName}</strong> (Đã đồng thuận
                  trực thế).
                </span>
              </div>
            )}
            <div className="flex flex-col gap-1 rounded-app-md border border-border bg-secondary/20 p-3.5">
              <span className="text-label font-semibold text-muted uppercase tracking-wider">
                Lý do gửi yêu cầu:
              </span>
              <p className="text-body text-foreground">{activeRequest.reason}</p>
            </div>
            {activeRequest.status === "PENDING" &&
              impact?.affectedSessions.length ? (
                <div className="rounded-app-md border border-warning/30 bg-warning-bg p-3.5 text-caption text-foreground">
                  Có {impact.affectedSessions.length} lịch hẹn cần phương án và xác nhận của bệnh nhân trước khi nghỉ được duyệt cuối.
                </div>
              ) : null}
            {activeRequest.status === "RESOLVING" &&
              (activeRequest.exceptions ?? []).map((exception) => {
                const isWaitingForPatient = exception.status === "PROPOSED";
                const isResolved = exception.status === "RESOLVED";
                const sessionDate = exception.careSession.appointmentSlot
                  ? new Intl.DateTimeFormat("vi-VN", {
                      dateStyle: "short",
                      timeZone: "Asia/Ho_Chi_Minh",
                    }).format(
                      new Date(exception.careSession.appointmentSlot.startsAt),
                    )
                  : "Chưa có thông tin giờ khám";
                return (
                  <ExceptionProposalEditor
                    key={exception.id}
                    exception={exception}
                    replacementDoctors={impact?.replacementDoctors ?? []}
                    isWaitingForPatient={isWaitingForPatient}
                    isResolved={isResolved}
                    isProposing={isProposing}
                    sessionDate={sessionDate}
                    onPropose={handlePropose}
                  />
                );
              })}
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
                disabled={
                  isSubmitting ||
                  !canReview ||
                  activeRequest.status === "APPROVED"
                }
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
              disabled={
                isSubmitting ||
                (activeRequest.status !== "PENDING" &&
                  activeRequest.status !== "RESOLVING" &&
                  activeRequest.status !== "URGENT")
              }
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
                disabled={
                  isSubmitting ||
                  activeRequest.status !== "PENDING" &&
                    activeRequest.status !== "URGENT"
                }
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

type ExceptionProposal = ApprovalRequestDetails["exceptions"][number];

function clinicDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function clinicTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));
}

interface ExceptionProposalEditorProps {
  exception: ExceptionProposal;
  replacementDoctors: LeaveImpact["replacementDoctors"];
  isWaitingForPatient: boolean;
  isResolved: boolean;
  isProposing: boolean;
  sessionDate: string;
  onPropose: (
    exceptionId: string,
    resolution: "REASSIGNED" | "RESCHEDULED" | "CANCELLED",
    toDoctorId?: string,
    toSlotId?: string,
  ) => void;
}

function ExceptionProposalEditor({
  exception,
  replacementDoctors,
  isWaitingForPatient,
  isResolved,
  isProposing,
  sessionDate,
  onPropose,
}: ExceptionProposalEditorProps) {
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState(() =>
    exception.careSession.appointmentSlot
      ? clinicDate(exception.careSession.appointmentSlot.startsAt)
      : "",
  );
  const [slotId, setSlotId] = useState("");
  const { currentData: slots = [], isFetching } = useGetReplacementSlotsQuery(
    { doctorId, date },
    { skip: !doctorId || !date || isWaitingForPatient || isResolved },
  );
  const originalSlot = exception.careSession.appointmentSlot;
  const selectedSlot = slots.find((slot) => slot.id === slotId);
  const canKeepTime =
    !!selectedSlot &&
    !!originalSlot &&
    new Date(selectedSlot.startsAt).getTime() ===
      new Date(originalSlot.startsAt).getTime() &&
    new Date(selectedSlot.endsAt).getTime() ===
      new Date(originalSlot.endsAt).getTime();

  return (
    <div className="rounded-app-md border border-border p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-caption font-semibold text-foreground">
          Lịch #{exception.careSession.appointment.appointmentCode} · {sessionDate}
        </span>
        <Badge
          variant={isResolved ? "success" : "warning"}
          size="sm"
          shape="pill"
        >
          {isResolved
            ? "Đã xử lý"
            : isWaitingForPatient
              ? "Chờ bệnh nhân xác nhận"
              : "Chưa có phương án"}
        </Badge>
      </div>
      {!isResolved && !isWaitingForPatient && (
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="flex min-w-52 flex-1 flex-col gap-1 text-caption text-muted">
            Bác sĩ thay thế
            <select
              value={doctorId}
              onChange={(event) => {
                setDoctorId(event.target.value);
                setSlotId("");
              }}
              disabled={isProposing}
              className="h-9 rounded-app-md border border-border bg-surface px-2 text-foreground"
            >
              <option value="">Chọn bác sĩ</option>
              {replacementDoctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.user.fullName} · {doctor.doctorCode}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-caption text-muted">
            Ngày khám
            <input
              type="date"
              value={date}
              onChange={(event) => {
                setDate(event.target.value);
                setSlotId("");
              }}
              disabled={isProposing}
              className="h-9 rounded-app-md border border-border bg-surface px-2 text-foreground"
            />
          </label>
          <label className="flex min-w-44 flex-1 flex-col gap-1 text-caption text-muted">
            Khung giờ còn trống
            <select
              value={slotId}
              onChange={(event) => setSlotId(event.target.value)}
              disabled={isFetching || !doctorId || !slots.length || isProposing}
              className="h-9 rounded-app-md border border-border bg-surface px-2 text-foreground"
            >
              <option value="">
                {isFetching ? "Đang tải khung giờ..." : "Chọn khung giờ"}
              </option>
              {slots.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {clinicTime(slot.startsAt)}–{clinicTime(slot.endsAt)}
                </option>
              ))}
            </select>
          </label>
          <Button
            type="button"
            variant="outline"
            disabled={isProposing || !canKeepTime}
            onClick={() =>
              selectedSlot &&
              void onPropose(
                exception.id,
                "REASSIGNED",
                doctorId,
                selectedSlot.id,
              )
            }
          >
            Đề xuất đổi bác sĩ
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isProposing || !selectedSlot}
            onClick={() =>
              selectedSlot &&
              void onPropose(
                exception.id,
                "RESCHEDULED",
                doctorId,
                selectedSlot.id,
              )
            }
          >
            Đề xuất đổi giờ
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isProposing}
            onClick={() => void onPropose(exception.id, "CANCELLED")}
          >
            Đề xuất hủy lịch
          </Button>
        </div>
      )}
    </div>
  );
}
