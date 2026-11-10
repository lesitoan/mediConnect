import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/Card";
import { getInitials } from "@/lib/utils";
import { EXCEPTION_STATUS_LABELS } from "../constants";
import type { ExceptionGroup, ExceptionSelection } from "../types/exceptionTypes";
import { formatExceptionDate } from "../utils";
interface Props { group: ExceptionGroup; totalAppointments: number; onDetails: (selection: ExceptionSelection) => void; }
export function ExceptionGroupCard({ group, totalAppointments, onDetails }: Props) {
  const pending = group.appointments.filter((item) => item.status === "PENDING").length;
  return <Card className="overflow-hidden border-border-strong">
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-5 py-4">
      <div className="flex min-w-0 items-center gap-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-light font-bold text-primary">{getInitials(group.title.replace(" vắng", ""))}</span><div><h2 className="text-base font-bold">{group.title}</h2><p className="text-caption text-muted">{group.doctorCode} · {group.specialtyName} · {formatExceptionDate(group.date)}</p></div></div>
      <div className="flex items-center gap-2"><Badge variant={group.urgency === "URGENT" ? "danger" : "brand"} shape="pill">{group.urgency === "URGENT" ? "KHẨN CẤP" : "CÓ KẾ HOẠCH"}</Badge><span className="rounded-full bg-secondary px-3 py-1 text-caption font-semibold">{pending}/{totalAppointments} cần xử lý</span></div>
    </div>
    <div className="grid gap-3 p-4 md:grid-cols-2">
      {group.appointments.map((appointment) => <div key={appointment.id} className="flex items-center gap-3 rounded-app-xl border border-border bg-background p-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-caption font-semibold text-muted">{getInitials(appointment.patientName)}</span><button type="button" className="min-w-0 flex-1 text-left" onClick={() => onDetails({ groupId: group.id, appointmentId: appointment.id })}><span className="block truncate text-body font-semibold">{appointment.patientName}</span><span className="block text-caption text-muted">{appointment.startTime}–{appointment.endTime} · {appointment.code}</span><span className="block text-label text-muted">{EXCEPTION_STATUS_LABELS[appointment.status]}</span></button><Button type="button" variant={appointment.status === "PENDING" ? "outline" : "ghost"} className="shrink-0 text-caption" onClick={() => onDetails({ groupId: group.id, appointmentId: appointment.id })}>{appointment.status === "PENDING" ? "Điều phối" : "Chi tiết"}</Button></div>)}
    </div>
  </Card>;
}
