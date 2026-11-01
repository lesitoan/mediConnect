"use client";

import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
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
        <Clock className="size-6 text-muted" />
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
          <TableHead className="w-[90px] px-3.5 py-2.5">Giờ</TableHead>
          <TableHead className="px-3.5 py-2.5">Bệnh nhân</TableHead>
          <TableHead className="px-3.5 py-2.5">Bác sĩ / Phòng khám</TableHead>
          <TableHead className="w-[140px] px-3.5 py-2.5">Trạng thái</TableHead>
          <TableHead className="w-[150px] px-3.5 py-2.5">Thanh toán</TableHead>
          <TableHead className="w-[110px] px-3.5 py-2.5 text-right">
            Thao tác
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {appointments.map((appointment) => {
          const isLate = appointment.status === "LATE";
          const isCheckedIn = appointment.status === "CHECKED_IN";
          return (
            <TableRow
              key={appointment.id}
              className={cn(
                "border-b border-border/80 transition-colors",
                isCheckedIn ? "bg-surface/50 opacity-90" : "hover:bg-item-hover",
              )}
            >
              <TableCell className="px-3.5 py-3 align-middle">
                <span
                  className={cn(
                    "text-body font-bold tabular-nums",
                    isLate ? "text-error" : "text-foreground",
                  )}
                >
                  {appointment.time}
                </span>
              </TableCell>
              <TableCell className="px-3.5 py-3 align-middle">
                <div className="flex flex-col">
                  <span className="max-w-[220px] truncate text-body font-bold text-foreground">
                    {appointment.patientName}
                  </span>
                  <span className="mt-0.5 text-caption font-mono text-muted">
                    {appointment.appointmentCode} • {appointment.patientCode}
                  </span>
                </div>
              </TableCell>
              <TableCell className="px-3.5 py-3 align-middle">
                <div className="flex flex-col">
                  <span className="max-w-[250px] truncate text-body font-semibold text-foreground">
                    {appointment.doctorDegree} {appointment.doctorName}
                  </span>
                  <span className="mt-0.5 text-caption text-muted">
                    {appointment.room} • {appointment.specialtyName}
                  </span>
                </div>
              </TableCell>
              <TableCell className="px-3.5 py-3 align-middle">
                {appointment.status === "WAITING_CHECKIN" && (
                  <Badge variant="brand" shape="pill">
                    Chờ check-in
                  </Badge>
                )}
                {appointment.status === "LATE" && (
                  <Badge
                    variant="warning"
                    shape="pill"
                    className="bg-error-bg text-error"
                  >
                    <AlertCircle className="size-3" />
                    Trễ hẹn
                  </Badge>
                )}
                {appointment.status === "CHECKED_IN" && (
                  <Badge variant="success" shape="pill">
                    <CheckCircle2 className="size-3" />
                    Đã check-in{" "}
                    {appointment.queueDisplayNumber
                      ? `(${appointment.queueDisplayNumber})`
                      : ""}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="px-3.5 py-3 align-middle">
                <span className="text-body font-medium text-warning">
                  Chưa thu
                </span>
              </TableCell>
              <TableCell className="px-3.5 py-3 text-right align-middle">
                {!isCheckedIn ? (
                  <Button
                    type="button"
                    variant={appointment.status === "WAITING_CHECKIN" ? "default" : "outline"}
                    size="sm"
                    onClick={() => onCheckIn(appointment)}
                    className="h-7 px-3 text-caption font-semibold"
                  >
                    Check-in
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails(appointment)}
                    className="h-7 gap-1 px-2.5 text-caption font-semibold text-muted"
                  >
                    <Eye className="size-3.5" />
                    Xem STT
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
