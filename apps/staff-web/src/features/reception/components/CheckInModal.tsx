"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  MapPin,
  Stethoscope,
  User,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import {
  checkInReceptionAppointment,
  getReceptionAppointment,
  getReceptionError,
} from "../services/receptionService";
import type {
  PatientAppointment,
  ReceptionAppointmentDetail,
} from "../types/receptionTypes";

interface CheckInModalProps {
  appointment: PatientAppointment | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (appointment: ReceptionAppointmentDetail) => void;
  onRefetch: () => Promise<void>;
}

export function CheckInModal({
  appointment,
  isOpen,
  onClose,
  onSuccess,
  onRefetch,
}: CheckInModalProps) {
  const [detail, setDetail] = useState<ReceptionAppointmentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !appointment) return;
    let isMounted = true;
    const timer = window.setTimeout(() => {
      setIsLoading(true);
      setErrorMessage(null);
      void getReceptionAppointment(appointment.id).then(
        (response) => {
          if (isMounted) setDetail(response);
        },
        (error: unknown) => {
          if (isMounted) setErrorMessage(getReceptionError(error).message);
        },
      ).finally(() => {
        if (isMounted) setIsLoading(false);
      });
    }, 0);
    return () => {
      isMounted = false;
      window.clearTimeout(timer);
    };
  }, [appointment, isOpen]);

  if (!appointment) return null;
  const currentAppointment = detail ?? appointment;
  const isLate = currentAppointment.status === "LATE";

  const handleConfirm = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await checkInReceptionAppointment(appointment.id);
      await onRefetch();
      onSuccess(response);
    } catch (error) {
      const normalizedError = getReceptionError(error);
      const isPendingResolution =
        normalizedError.message === "Appointment is pending resolution";
      setErrorMessage(
        isPendingResolution
          ? "Lịch hẹn đang chờ xử lý và chưa thể check-in."
          : normalizedError.status === 409
            ? "Lịch hẹn đã được check-in hoặc STT vừa bị cấp, vui lòng tải lại."
            : normalizedError.message,
      );
      if (normalizedError.status === 409) await onRefetch();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[560px] p-0">
        <DialogHeader className="flex-row items-center gap-3 space-y-0 border-b border-border p-5 pb-4">
          <div className="flex size-9 items-center justify-center rounded-app-lg bg-primary-light text-primary">
            <CheckCircle2 className="size-5" />
          </div>
          <div className="flex-1">
            <DialogTitle>Xác nhận Check-in bệnh nhân</DialogTitle>
            <DialogDescription className="text-caption text-muted">
              Xác nhận bệnh nhân đã có mặt tại quầy để xếp vào hàng chờ.
            </DialogDescription>
          </div>
        </DialogHeader>
        {isLoading ? (
          <div className="p-8 text-center text-muted">Đang tải thông tin...</div>
        ) : (
          <>
            <div className="space-y-4 px-6 py-4">
              <div className="rounded-app-xl border border-border bg-background p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <User className="size-4 text-primary" />
                    <div>
                      <div className="text-body font-bold text-foreground">
                        {currentAppointment.patientName}
                      </div>
                      <div className="text-caption font-mono text-muted">
                        Mã BN: {currentAppointment.patientCode} • SĐT:{" "}
                        {currentAppointment.patientPhone}
                      </div>
                    </div>
                  </div>
                  <Badge variant="warning" shape="pill">
                    Chưa thu
                  </Badge>
                </div>
              </div>
              <div className="space-y-2.5 rounded-app-xl border border-border bg-surface p-3.5 text-caption">
                <div className="flex items-center justify-between border-b border-border/60 py-1">
                  <span className="flex items-center gap-1.5 text-muted">
                    <Stethoscope className="size-3.5 text-primary" />
                    Bác sĩ phụ trách
                  </span>
                  <span className="font-bold text-foreground">
                    {currentAppointment.doctorDegree}{" "}
                    {currentAppointment.doctorName}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-border/60 py-1">
                  <span className="flex items-center gap-1.5 text-muted">
                    <MapPin className="size-3.5 text-primary" />
                    Phòng khám & Chuyên khoa
                  </span>
                  <span className="font-semibold text-foreground">
                    {currentAppointment.room} • {currentAppointment.specialtyName}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-border/60 py-1">
                  <span className="flex items-center gap-1.5 text-muted">
                    <Clock className="size-3.5 text-primary" />
                    Khung giờ hẹn khám
                  </span>
                  <span className="font-bold tabular-nums text-foreground">
                    {currentAppointment.time}
                  </span>
                </div>
                <div className="flex items-start justify-between py-1">
                  <span className="text-muted">Lý do khám</span>
                  <span className="max-w-[280px] text-right font-medium text-foreground">
                    {currentAppointment.reason || "Không có"}
                  </span>
                </div>
              </div>
              {errorMessage && (
                <div className="flex items-start gap-2 rounded-app-lg border border-error/30 bg-error-bg p-3 text-caption text-error">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
              {isLate && !errorMessage && (
                <div className="text-caption text-error">
                  Lịch hẹn đã quá giờ. Vẫn có thể check-in.
                </div>
              )}
            </div>
            <DialogFooter className="gap-2 border-t border-border bg-secondary/20 p-4">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Hủy bỏ
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                disabled={isSubmitting}
                onClick={() => void handleConfirm()}
              >
                <CheckCircle2 className="size-4" />
                {isSubmitting ? "Đang xử lý..." : "Xác nhận Check-in"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
