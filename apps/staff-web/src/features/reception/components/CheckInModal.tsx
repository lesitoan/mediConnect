"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import { CheckCircle2, User, Stethoscope, Clock, MapPin, AlertCircle } from "lucide-react";
import type { PatientAppointment } from "../types/receptionTypes";

interface CheckInModalProps {
  appointment: PatientAppointment | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmCheckIn: (appointment: PatientAppointment) => void;
}

export function CheckInModal({
  appointment,
  isOpen,
  onClose,
  onConfirmCheckIn,
}: CheckInModalProps) {
  if (!appointment) return null;

  const isLate = appointment.status === "LATE";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[560px] p-0">
        <DialogHeader className="flex-row items-center gap-3 space-y-0 p-5 pb-4 border-b border-border">
          <div className="flex size-9 items-center justify-center rounded-app-lg bg-primary-light text-primary">
            <CheckCircle2 className="size-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <DialogTitle>Xác nhận Check-in bệnh nhân</DialogTitle>
              {isLate ? (
                <Badge variant="warning" shape="pill" className="text-error bg-error-bg">
                  Đến trễ hẹn
                </Badge>
              ) : appointment.status === "WAITING_CHECKIN" ? (
                <Badge variant="brand" shape="pill">
                  Đã có mặt
                </Badge>
              ) : (
                <Badge variant="neutral" shape="pill">
                  Check-in sớm
                </Badge>
              )}
            </div>
            <DialogDescription className="text-caption text-muted">
              Xác nhận bệnh nhân đã có mặt tại quầy để xếp vào hàng chờ phòng khám.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-4 px-6 py-4">
          {/* Thông tin bệnh nhân */}
          <div className="rounded-app-xl border border-border bg-background p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-full bg-primary-light text-primary">
                  <User className="size-4" />
                </div>
                <div>
                  <div className="text-body font-bold text-foreground">
                    {appointment.patientName}
                  </div>
                  <div className="text-caption font-mono text-muted">
                    Mã BN: {appointment.patientCode} • SĐT: {appointment.patientPhone}
                  </div>
                </div>
              </div>

              <div>
                {appointment.paymentStatus === "PAID" && (
                  <Badge variant="success" shape="pill">
                    Đã thanh toán
                  </Badge>
                )}
                {appointment.paymentStatus === "UNPAID" && (
                  <Badge variant="warning" shape="pill">
                    Chưa thu phí
                  </Badge>
                )}
                {appointment.paymentStatus === "FREE_REEXAM" && (
                  <Badge variant="neutral" shape="pill">
                    Tái khám miễn phí
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Chi tiết lượt khám */}
          <div className="space-y-2.5 rounded-app-xl border border-border bg-surface p-3.5 text-caption">
            <div className="flex items-center justify-between py-1 border-b border-border/60">
              <span className="flex items-center gap-1.5 text-muted">
                <Stethoscope className="size-3.5 text-primary" />
                <span>Bác sĩ phụ trách:</span>
              </span>
              <span className="font-bold text-foreground">
                {appointment.doctorDegree} {appointment.doctorName}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-border/60">
              <span className="flex items-center gap-1.5 text-muted">
                <MapPin className="size-3.5 text-primary" />
                <span>Phòng khám & Chuyên khoa:</span>
              </span>
              <span className="font-semibold text-foreground">
                {appointment.room} • {appointment.specialtyName}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-border/60">
              <span className="flex items-center gap-1.5 text-muted">
                <Clock className="size-3.5 text-primary" />
                <span>Khung giờ hẹn khám:</span>
              </span>
              <span className="font-bold text-foreground tabular-nums">
                {appointment.time}
              </span>
            </div>

            {appointment.reason && (
              <div className="flex items-start justify-between py-1">
                <span className="text-muted">Lý do khám:</span>
                <span className="font-medium text-foreground text-right max-w-[280px]">
                  {appointment.reason}
                </span>
              </div>
            )}
          </div>

          {/* Callout thông báo */}
          <div className="flex items-start gap-2.5 rounded-app-lg border border-primary/20 bg-primary-light/40 p-3 text-caption text-primary">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>
              Hệ thống sẽ cấp số thứ tự khám (STT) tự động và chuyển thông tin bệnh nhân tới màn hình hàng chờ của phòng khám.
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2 p-4 border-t border-border bg-secondary/20">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-muted hover:text-foreground"
          >
            Hủy bỏ
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => onConfirmCheckIn(appointment)}
            className="gap-1.5"
          >
            <CheckCircle2 className="size-4" />
            <span>Xác nhận Check-in</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
