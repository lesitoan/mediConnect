"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { CheckCircle2, ListOrdered, Printer } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import {
  getReceptionError,
  getReceptionTicket,
} from "../services/receptionService";
import type {
  PatientAppointment,
  ReceptionTicket,
} from "../types/receptionTypes";

interface CheckInSuccessModalProps {
  appointment: PatientAppointment | null;
  isOpen: boolean;
  onClose: () => void;
  onViewQueue: (appointment: PatientAppointment) => void;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function printTicket(ticket: ReceptionTicket): void {
  const printWindow = window.open("", "_blank", "width=420,height=700");
  if (!printWindow) {
    throw new Error("Trình duyệt đã chặn cửa sổ in phiếu khám.");
  }
  const printedAt = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date());
  printWindow.document.write(`
    <!doctype html>
    <html lang="vi">
      <head>
        <meta charset="utf-8" />
        <title>Phiếu khám ${escapeHtml(ticket.appointmentCode)}</title>
        <style>
          body { font-family: Arial, sans-serif; width: 76mm; margin: 0 auto; padding: 8mm 4mm; color: #111; }
          h1 { font-size: 18px; text-align: center; margin: 0 0 14px; }
          .row { display: flex; justify-content: space-between; gap: 12px; margin: 7px 0; font-size: 12px; }
          .value { text-align: right; font-weight: 600; }
          .queue { text-align: center; font-size: 42px; font-weight: 700; margin: 18px 0; }
          .muted { color: #555; font-size: 10px; text-align: center; margin-top: 16px; }
        </style>
      </head>
      <body>
        <h1>PHIẾU KHÁM</h1>
        <div class="queue">${escapeHtml(ticket.queueDisplayNumber ?? "")}</div>
        <div class="row"><span>Bệnh nhân</span><span class="value">${escapeHtml(ticket.patient.fullName)}</span></div>
        <div class="row"><span>Mã BN</span><span class="value">${escapeHtml(ticket.patient.patientCode)}</span></div>
        <div class="row"><span>Bác sĩ</span><span class="value">${escapeHtml(ticket.doctor.title)} ${escapeHtml(ticket.doctor.name)}</span></div>
        <div class="row"><span>Phòng</span><span class="value">${escapeHtml(ticket.room ?? "")}</span></div>
        <div class="row"><span>Khoa</span><span class="value">${escapeHtml(ticket.specialty.name)}</span></div>
        <div class="row"><span>Giờ khám</span><span class="value">${escapeHtml(ticket.appointmentTime)}</span></div>
        <div class="muted">In lúc ${escapeHtml(printedAt)}</div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

export function CheckInSuccessModal({
  appointment,
  isOpen,
  onClose,
  onViewQueue,
}: CheckInSuccessModalProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  if (!appointment) return null;
  const isLate = appointment.isLate ?? appointment.status === "LATE";

  const handlePrint = async () => {
    if (isPrinting) return;
    setIsPrinting(true);
    try {
      const ticket = await getReceptionTicket(appointment.id);
      printTicket(ticket);
    } catch (error) {
      toast.error(getReceptionError(error).message);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[500px] p-0">
        <DialogHeader className="border-b border-border p-5 pb-3">
          <DialogTitle>Check-in thành công</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 px-6 py-4">
          <div className="flex items-start gap-3 rounded-app-xl border border-emerald-200 bg-success-bg p-4">
            <CheckCircle2 className="size-5 shrink-0 text-success" />
            <div className="text-body font-bold text-success">
              Bệnh nhân đã được xếp vào hàng chờ
            </div>
          </div>
          <div className="space-y-3 rounded-app-xl border border-border bg-background p-4 text-caption">
            <div className="flex items-center justify-between border-b border-border/70 pb-2">
              <span className="text-muted">Bệnh nhân</span>
              <div className="text-right">
                <div className="text-body font-bold text-foreground">
                  {appointment.patientName}
                </div>
                <div className="text-caption text-muted">
                  Mã BN: {appointment.patientCode}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-b border-border/70 pb-2">
              <span className="text-muted">Số thứ tự khám</span>
              <Badge
                variant="success"
                className="px-3 py-1 text-base font-bold tracking-wider"
              >
                {appointment.queueDisplayNumber ?? ""}
              </Badge>
            </div>
            <div className="flex items-center justify-between border-b border-border/70 pb-2">
              <span className="text-muted">Bác sĩ / Phòng khám</span>
              <div className="text-right">
                <div className="text-body font-bold text-foreground">
                  {appointment.doctorDegree} {appointment.doctorName}
                </div>
                <div className="text-caption text-muted">
                  {appointment.room} • {appointment.specialtyName}
                </div>
              </div>
            </div>
            <div className={isLate ? "text-error" : "text-success"}>
              <div className="flex items-center justify-between font-bold tabular-nums">
                <span>Giờ khám</span>
                <span>
                  {appointment.time}{" "}
                  <span className="font-normal">
                    ({isLate ? "Trễ hẹn" : "Đúng giờ"})
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 border-t border-border bg-secondary/20 p-4">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Đóng
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPrinting}
            onClick={() => void handlePrint()}
          >
            <Printer className="size-3.5" />
            {isPrinting ? "Đang tải..." : "In phiếu khám"}
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => onViewQueue(appointment)}
          >
            <ListOrdered className="size-4" />
            Xem hàng chờ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
