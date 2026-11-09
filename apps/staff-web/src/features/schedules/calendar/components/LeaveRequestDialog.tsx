"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { formatAuthError } from "@/features/auth/services/authApi";
import {
  useCreateMyLeaveRequestMutation,
  useGetMyLeaveImpactQuery,
} from "../services/schedulesApi";

type LeaveRequestKind = "PLANNED_LEAVE" | "URGENT_ABSENCE";

interface LeaveRequestDialogProps {
  requestType: LeaveRequestKind;
  initialStartsAt?: string;
  initialEndsAt?: string;
  onClose: () => void;
}

const MIN_PLANNED_LEAVE_NOTICE_HOURS = 48;
const HOUR_IN_MILLISECONDS = 60 * 60 * 1000;
const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
const CLINIC_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Ho_Chi_Minh",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function getClinicDateTimeInputValue(date: Date) {
  const parts = Object.fromEntries(
    CLINIC_DATE_TIME_FORMATTER.formatToParts(date).map(({ type, value }) => [
      type,
      value,
    ]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function parseClinicDateTime(value: string) {
  if (!value) return null;
  const date = new Date(`${value}:00+07:00`);
  return Number.isFinite(date.getTime()) ? date : null;
}

function getRequestStatusLabel(status: string) {
  switch (status) {
    case "SCHEDULED":
      return "Đã lên lịch";
    case "CHECKED_IN":
      return "Đã check-in";
    case "IN_PROGRESS":
      return "Đang khám";
    case "PENDING_RESOLUTION":
      return "Chờ xử lý";
    default:
      return status;
  }
}

export function LeaveRequestDialog({
  requestType,
  initialStartsAt,
  initialEndsAt,
  onClose,
}: LeaveRequestDialogProps) {
  const [createLeaveRequest, { isLoading }] =
    useCreateMyLeaveRequestMutation();
  const [activeRequestType, setActiveRequestType] =
    useState<LeaveRequestKind>(requestType);
  const [reason, setReason] = useState("");
  const [startsAtInput, setStartsAtInput] = useState(() =>
    initialStartsAt ? getClinicDateTimeInputValue(new Date(initialStartsAt)) : "",
  );
  const [endsAtInput, setEndsAtInput] = useState(() =>
    initialEndsAt ? getClinicDateTimeInputValue(new Date(initialEndsAt)) : "",
  );
  const [now, setNow] = useState(0);
  const isClockReady = now > 0;
  const startsAtDate = parseClinicDateTime(startsAtInput);
  const endsAtDate = parseClinicDateTime(endsAtInput);
  const hasBothDates = startsAtDate !== null && endsAtDate !== null;
  const isEndBeforeStart =
    hasBothDates && endsAtDate.getTime() <= startsAtDate.getTime();
  const isValidRange = hasBothDates && !isEndBeforeStart;
  const isPastStart =
    startsAtDate !== null && startsAtDate.getTime() <= now;
  const noticeHours =
    startsAtDate === null
      ? Number.NEGATIVE_INFINITY
      : Math.floor(
          (startsAtDate.getTime() - now) / HOUR_IN_MILLISECONDS,
        );
  const isNoticeValid =
    activeRequestType === "PLANNED_LEAVE"
      ? noticeHours >= MIN_PLANNED_LEAVE_NOTICE_HOURS
      : noticeHours < MIN_PLANNED_LEAVE_NOTICE_HOURS;
  const startsAt = startsAtDate?.toISOString() ?? "";
  const endsAt = endsAtDate?.toISOString() ?? "";
  const canLoadImpact =
    activeRequestType === "PLANNED_LEAVE" &&
    isValidRange &&
    !isPastStart &&
    isNoticeValid;
  const {
    currentData: leaveImpact,
    isFetching: isLoadingImpact,
    isError: isImpactError,
    refetch: refetchImpact,
  } = useGetMyLeaveImpactQuery(
    { startsAt, endsAt },
    { skip: !canLoadImpact },
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setNow(Date.now()), 0);
    const intervalId = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isClockReady || !isValidRange || isPastStart || !isNoticeValid) return;
    if (
      activeRequestType === "PLANNED_LEAVE" &&
      (!leaveImpact || isLoadingImpact || isImpactError)
    ) {
      toast.error("Vui lòng tải được lịch khám bị ảnh hưởng trước khi xác nhận.");
      return;
    }
    if (!reason.trim()) {
      toast.error("Vui lòng nhập lý do.");
      return;
    }

    try {
      await createLeaveRequest({
      requestType: activeRequestType,
        startsAt,
        endsAt,
        reason: reason.trim(),
      }).unwrap();
      toast.success("Đã gửi yêu cầu, vui lòng chờ quản lý duyệt.");
      onClose();
    } catch (error) {
      toast.error(formatAuthError(error, "Không thể gửi yêu cầu nghỉ."));
    }
  };

  const isPlannedLeave = activeRequestType === "PLANNED_LEAVE";
  const canConvertToUrgentAbsence =
    isPlannedLeave &&
    startsAtDate !== null &&
    !isPastStart &&
    noticeHours >= 0 &&
    noticeHours < MIN_PLANNED_LEAVE_NOTICE_HOURS;
  const canSubmit =
    isValidRange &&
    isClockReady &&
    !isPastStart &&
    isNoticeValid &&
    Boolean(reason.trim()) &&
    !isLoading &&
    (!isPlannedLeave ||
      (Boolean(leaveImpact) && !isLoadingImpact && !isImpactError));

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-h-[90dvh] max-w-[640px] overflow-y-auto"
        showCloseButton={!isLoading}
      >
        <DialogHeader>
          <DialogTitle>
            {isPlannedLeave ? "Xin nghỉ phép" : "Báo vắng đột xuất"}
          </DialogTitle>
          <DialogDescription>
            Chọn thời gian cần nghỉ và nhập lý do. Lịch chỉ chuyển trạng thái
            sau khi yêu cầu được duyệt.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label
                htmlFor="leave-starts-at"
                className="grid gap-1.5 text-caption font-medium"
              >
                Ngày giờ bắt đầu
                <Input
                  id="leave-starts-at"
                  type="datetime-local"
                  required
                  min={getClinicDateTimeInputValue(new Date(now))}
                  value={startsAtInput}
                  onChange={(event) => setStartsAtInput(event.target.value)}
                  disabled={isLoading || !isClockReady}
                />
              </label>
              <label
                htmlFor="leave-ends-at"
                className="grid gap-1.5 text-caption font-medium"
              >
                Ngày giờ kết thúc
                <Input
                  id="leave-ends-at"
                  type="datetime-local"
                  required
                  min={startsAtInput || getClinicDateTimeInputValue(new Date(now))}
                  value={endsAtInput}
                  onChange={(event) => setEndsAtInput(event.target.value)}
                  disabled={isLoading || !isClockReady}
                />
              </label>
            </div>

            {hasBothDates && (
              <div className="rounded-app-lg border border-border bg-secondary/20 p-3 text-caption">
                {isValidRange && (
                  <p>
                    Thời gian nghỉ: {DATE_TIME_FORMATTER.format(startsAtDate)}{" "}
                    – {DATE_TIME_FORMATTER.format(endsAtDate)}
                  </p>
                )}
                {!isNoticeValid && (
                  <p className="mt-1 font-medium text-destructive">
                    {isPlannedLeave
                      ? "Xin nghỉ phép cần gửi trước ít nhất 48 giờ. Với thời gian này, hãy chọn báo vắng đột xuất."
                      : "Thời gian bắt đầu còn từ 48 giờ trở lên. Hãy chọn xin nghỉ phép."}
                  </p>
                )}
                {canConvertToUrgentAbsence && (
                  <div className="mt-3 rounded-app-md border border-warning/30 bg-warning/10 p-3">
                    <p className="text-caption text-foreground">
                      Thời gian bắt đầu còn dưới 48 giờ. Bạn có muốn chuyển yêu cầu này thành báo vắng đột xuất không?
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      className="mt-2"
                      onClick={() => setActiveRequestType("URGENT_ABSENCE")}
                      disabled={isLoading}
                    >
                      Đồng ý, chuyển sang báo vắng
                    </Button>
                  </div>
                )}
                {isPastStart && (
                  <p className="mt-1 font-medium text-destructive">
                    Thời gian bắt đầu phải ở trong tương lai.
                  </p>
                )}
                {isEndBeforeStart && (
                  <p className="mt-1 font-medium text-destructive">
                    Thời gian kết thúc phải sau thời gian bắt đầu.
                  </p>
                )}
              </div>
            )}

            {isPlannedLeave && (
              <section
                aria-live="polite"
                className="grid gap-2 rounded-app-lg border border-border p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-caption font-semibold text-foreground">
                    Lịch khám bị ảnh hưởng
                  </h3>
                  {isImpactError && (
                    <Button
                      type="button"
                      size="xs"
                      variant="outline"
                      onClick={() => void refetchImpact()}
                    >
                      Thử lại
                    </Button>
                  )}
                </div>
                {!canLoadImpact ? (
                  <p className="text-caption text-muted">
                    Chọn khoảng nghỉ hợp lệ và gửi trước ít nhất 48 giờ để xem
                    lịch khám liên quan.
                  </p>
                ) : isLoadingImpact ? (
                  <p className="text-caption text-muted">
                    Đang tải lịch khám liên quan...
                  </p>
                ) : isImpactError ? (
                  <p role="alert" className="text-caption text-destructive">
                    Không thể tải lịch khám bị ảnh hưởng.
                  </p>
                ) : leaveImpact?.affectedSessions.length ? (
                  <ul className="grid max-h-40 gap-2 overflow-y-auto">
                    {leaveImpact.affectedSessions.map((session) => (
                      <li
                        key={session.id}
                        className="rounded-app-md bg-secondary/30 p-2 text-caption"
                      >
                        <p className="font-semibold">
                          {session.appointmentCode} · {session.specialtyName}
                        </p>
                        <p className="text-muted">
                          {DATE_TIME_FORMATTER.format(
                            new Date(session.startsAt),
                          )}{" "}
                          –{" "}
                          {DATE_TIME_FORMATTER.format(
                            new Date(session.endsAt),
                          )}
                          {" · "}
                          {getRequestStatusLabel(session.status)}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-caption text-muted">
                    Không có lịch khám nào bị ảnh hưởng trong khoảng thời gian
                    này.
                  </p>
                )}
              </section>
            )}

            <label className="grid gap-1.5 text-caption font-medium">
              Lý do
              <Textarea
                required
                maxLength={2000}
                rows={4}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Nhập lý do nghỉ"
                disabled={isLoading}
              />
            </label>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Đóng
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isLoading ? "Đang gửi..." : "Xác nhận"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
