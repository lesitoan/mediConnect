import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/Card";
import { getInitials } from "@/lib/utils";
import { EXCEPTION_STATUS_LABELS } from "../constants";
import type {
  ExceptionGroup,
  ExceptionSelection,
} from "../types/exceptionTypes";
import { formatExceptionDate } from "../utils";

interface ExceptionGroupCardProps {
  group: ExceptionGroup;
  totalAppointments: number;
  onDetails: (selection: ExceptionSelection) => void;
}

export function ExceptionGroupCard({
  group,
  totalAppointments,
  onDetails,
}: ExceptionGroupCardProps) {
  const appointmentCount =
    group.appointments.length === totalAppointments
      ? String(totalAppointments)
      : `${group.appointments.length}/${totalAppointments}`;

  return (
    <Card className="overflow-hidden border-border-strong">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3.5">
        <div className="space-y-1">
          <h2 className="text-base font-bold">{group.title}</h2>
          <p className="text-caption text-muted">
            {appointmentCount} lịch hẹn bị ảnh hưởng ·{" "}
            {formatExceptionDate(group.date)}
          </p>
        </div>
        <Badge
          variant={group.urgency === "URGENT" ? "danger" : "brand"}
          shape="pill"
        >
          {group.urgency === "URGENT"
            ? "KHẨN CẤP"
            : (group.leadTimeLabel ?? "Có kế hoạch")}
        </Badge>
      </div>
      <ul className="divide-y divide-border/60">
        {group.appointments.map((appointment) => {
          const selection = {
            groupId: group.id,
            appointmentId: appointment.id,
          };
          return (
            <li
              key={appointment.id}
              className="flex items-center gap-2 px-3 py-2 transition-colors hover:bg-item-hover/50 sm:gap-4 sm:px-4"
            >
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-3 rounded-app-md py-1.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onClick={() => onDetails(selection)}
                aria-label={`Chi tiết điều phối ${appointment.patientName} · ${appointment.code}`}
              >
                <span
                  aria-hidden="true"
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-caption font-semibold text-muted"
                >
                  {getInitials(appointment.patientName)}
                </span>
                <span className="min-w-0 space-y-0.5">
                  <span className="block text-body font-semibold">
                    {appointment.patientName}
                  </span>
                  <span className="block text-caption text-muted">
                    {appointment.startTime}–{appointment.endTime} ·{" "}
                    {EXCEPTION_STATUS_LABELS[appointment.status]}
                  </span>
                  <span className="block text-label text-muted">
                    {appointment.code}
                  </span>
                </span>
              </button>
              <Button
                type="button"
                variant={appointment.status === "PENDING" ? "outline" : "ghost"}
                className="text-caption"
                aria-label={`${appointment.status === "PENDING" ? "Điều phối" : "Xem chi tiết"} · ${appointment.code}`}
                onClick={() => onDetails(selection)}
              >
                {appointment.status === "PENDING"
                  ? "Điều phối"
                  : "Xem chi tiết"}
              </Button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
