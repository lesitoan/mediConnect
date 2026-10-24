"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import { CheckCircle2, Printer, ListOrdered } from "lucide-react";
import type { PatientAppointment } from "../types/receptionTypes";

interface CheckInSuccessModalProps {
  appointment: PatientAppointment | null;
  isOpen: boolean;
  onClose: () => void;
  onViewQueue?: () => void;
}

export function CheckInSuccessModal({
  appointment,
  isOpen,
  onClose,
  onViewQueue,
}: CheckInSuccessModalProps) {
  if (!appointment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[500px] p-0">
        <DialogHeader className="p-5 pb-3 border-b border-border">
          <DialogTitle className="text-title font-bold text-foreground">
            Check-in thành công
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 px-6 py-4">
          {/* Green Success Banner */}
          <div className="flex items-start gap-3 rounded-app-xl bg-success-bg p-4 border border-emerald-200">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-success text-white">
              <CheckCircle2 className="size-4 stroke-[2.5]" />
            </div>
            <div>
              <div className="text-body font-bold text-success">
                Bệnh nhân đã được check-in
              </div>
              <div className="mt-0.5 text-caption text-success/80">
                Đã ghi nhận vào hàng chờ khám thành công
              </div>
            </div>
          </div>

          {/* Details Card */}
          <div className="rounded-app-xl border border-border bg-background p-4 space-y-3 text-caption">
            {/* Bệnh nhân */}
            <div className="flex items-center justify-between pb-2 border-b border-border/70">
              <span className="text-muted font-medium">Bệnh nhân</span>
              <div className="text-right">
                <div className="text-body font-bold text-foreground">
                  {appointment.patientName}
                </div>
                <div className="text-caption text-muted">
                  Mã BN: {appointment.patientCode}
                </div>
              </div>
            </div>

            {/* Số thứ tự khám */}
            <div className="flex items-center justify-between pb-2 border-b border-border/70">
              <span className="text-muted font-medium">Số thứ tự khám</span>
              <Badge
                variant="success"
                className="px-3 py-1 text-base font-bold tracking-wider"
              >
                {appointment.queueNumber || "A-023"}
              </Badge>
            </div>

            {/* Bác sĩ / Phòng khám */}
            <div className="flex items-center justify-between pb-2 border-b border-border/70">
              <span className="text-muted font-medium">Bác sĩ / Phòng khám</span>
              <div className="text-right">
                <div className="text-body font-bold text-foreground">
                  {appointment.doctorDegree} {appointment.doctorName}
                </div>
                <div className="text-caption text-muted">
                  {appointment.room} • {appointment.specialtyName}
                </div>
              </div>
            </div>

            {/* Giờ khám */}
            <div className="flex items-center justify-between">
              <span className="text-muted font-medium">Giờ khám</span>
              <div className="flex items-center gap-1.5 font-bold text-success tabular-nums">
                <span>{appointment.time}</span>
                <span className="font-normal">(Đúng giờ)</span>
              </div>
            </div>
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
            Đóng
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="gap-1.5 text-foreground"
          >
            <Printer className="size-3.5" />
            <span>In phiếu khám</span>
          </Button>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => {
              onClose();
              onViewQueue?.();
            }}
            className="gap-1.5"
          >
            <ListOrdered className="size-4" />
            <span>Xem hàng chờ</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
