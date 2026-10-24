"use client";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Clock, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PatientAppointment } from "../types/receptionTypes";

interface ReceptionTableProps {
  appointments: PatientAppointment[];
  onCheckIn: (appointment: PatientAppointment) => void;
  onViewDetails: (appointment: PatientAppointment) => void;
}

export function ReceptionTable({
  appointments,
  onCheckIn,
  onViewDetails,
}: ReceptionTableProps) {
  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted">
          <Clock className="size-6" />
        </div>
        <h3 className="mt-3 text-base font-bold text-foreground">
          Không có lịch hẹn nào phù hợp
        </h3>
        <p className="mt-1 text-caption text-muted">
          Thử thay đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm bệnh nhân.
        </p>
      </div>
    );
  }

  return (
    <Table>
        <TableHeader>
          <TableRow className="border-b border-border bg-secondary/40 hover:bg-secondary/40">
            <TableHead className="w-[90px] px-3.5 py-2.5 font-bold uppercase tracking-wider text-caption text-muted">
              Giờ
            </TableHead>
            <TableHead className="px-3.5 py-2.5 font-bold uppercase tracking-wider text-caption text-muted">
              Bệnh nhân
            </TableHead>
            <TableHead className="px-3.5 py-2.5 font-bold uppercase tracking-wider text-caption text-muted">
              Bác sĩ / Phòng khám
            </TableHead>
            <TableHead className="w-[140px] px-3.5 py-2.5 font-bold uppercase tracking-wider text-caption text-muted">
              Trạng thái
            </TableHead>
            <TableHead className="w-[150px] px-3.5 py-2.5 font-bold uppercase tracking-wider text-caption text-muted">
              Thanh toán
            </TableHead>
            <TableHead className="w-[110px] px-3.5 py-2.5 text-right font-bold uppercase tracking-wider text-caption text-muted">
              Thao tác
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {appointments.map((apt) => {
            const isLate = apt.status === "LATE";
            const isCheckedIn = apt.status === "CHECKED_IN";
            const isWaitingCheckIn = apt.status === "WAITING_CHECKIN";

            return (
              <TableRow
                key={apt.id}
                className={cn(
                  "border-b border-border/80 transition-colors",
                  isCheckedIn ? "bg-surface/50 opacity-90" : "hover:bg-item-hover"
                )}
              >
                {/* 1. GIỜ */}
                <TableCell className="px-3.5 py-3 align-middle">
                  <span
                    className={cn(
                      "text-body font-bold tabular-nums",
                      isLate ? "text-error" : "text-foreground"
                    )}
                  >
                    {apt.time}
                  </span>
                </TableCell>

                {/* 2. BỆNH NHÂN */}
                <TableCell className="px-3.5 py-3 align-middle">
                  <div className="flex flex-col">
                    <span className="text-body font-bold text-foreground truncate max-w-[220px]">
                      {apt.patientName}
                    </span>
                    <span className="mt-0.5 text-caption font-mono text-muted">
                      {apt.appointmentCode} • {apt.patientCode}
                    </span>
                  </div>
                </TableCell>

                {/* 3. BÁC SĨ / PHÒNG KHÁM */}
                <TableCell className="px-3.5 py-3 align-middle">
                  <div className="flex flex-col">
                    <span className="text-body font-semibold text-foreground truncate max-w-[250px]">
                      {apt.doctorDegree} {apt.doctorName}
                    </span>
                    <span className="mt-0.5 text-caption text-muted">
                      {apt.room} • {apt.specialtyName}
                    </span>
                  </div>
                </TableCell>

                {/* 4. TRẠNG THÁI */}
                <TableCell className="px-3.5 py-3 align-middle">
                  {apt.status === "WAITING_CHECKIN" && (
                    <Badge variant="brand" shape="pill" className="gap-1 font-semibold">
                      <span className="size-1.5 rounded-full bg-primary" />
                      <span>Chờ check-in</span>
                    </Badge>
                  )}

                  {apt.status === "UPCOMING" && (
                    <Badge variant="neutral" shape="pill" className="gap-1 font-medium">
                      <span className="size-1.5 rounded-full bg-muted" />
                      <span>Sắp đến</span>
                    </Badge>
                  )}

                  {apt.status === "LATE" && (
                    <Badge variant="warning" shape="pill" className="gap-1 font-semibold text-error bg-error-bg">
                      <AlertCircle className="size-3" />
                      <span>Trễ hẹn</span>
                    </Badge>
                  )}

                  {apt.status === "CHECKED_IN" && (
                    <Badge variant="success" shape="pill" className="gap-1 font-semibold">
                      <CheckCircle2 className="size-3" />
                      <span>Đã check-in {apt.queueNumber ? `(${apt.queueNumber})` : ""}</span>
                    </Badge>
                  )}
                </TableCell>

                {/* 5. THANH TOÁN */}
                <TableCell className="px-3.5 py-3 align-middle">
                  {apt.paymentStatus === "PAID" && (
                    <span className="text-body font-semibold text-success">
                      Đã thu
                    </span>
                  )}
                  {apt.paymentStatus === "UNPAID" && (
                    <span className="text-body font-medium text-warning">
                      Chưa thu
                    </span>
                  )}
                  {apt.paymentStatus === "FREE_REEXAM" && (
                    <span className="text-body font-medium text-muted">
                      Miễn phí tái khám
                    </span>
                  )}
                </TableCell>

                {/* 6. THAO TÁC */}
                <TableCell className="px-3.5 py-3 text-right align-middle">
                  {!isCheckedIn ? (
                    <Button
                      type="button"
                      variant={isWaitingCheckIn ? "default" : "outline"}
                      size="sm"
                      onClick={() => onCheckIn(apt)}
                      className={cn(
                        "h-7 px-3 text-caption font-semibold shadow-xs",
                        !isWaitingCheckIn && "text-primary border-border hover:bg-primary-light"
                      )}
                    >
                      Check-in
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails(apt)}
                      className="h-7 gap-1 px-2.5 text-caption font-semibold text-muted hover:text-foreground"
                    >
                      <Eye className="size-3.5" />
                      <span>Xem STT</span>
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
  );
}
