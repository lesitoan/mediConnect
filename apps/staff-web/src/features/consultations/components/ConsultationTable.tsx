"use client";

import { Info } from "lucide-react";
import { toast } from "react-hot-toast";
import { Badge } from "@/components/ui/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { cn } from "@/lib/utils";
import type {
  ConsultationSession,
  ConsultationStatus,
} from "../types/consultationTypes";

interface ConsultationTableProps {
  sessions: readonly ConsultationSession[];
}

const STATUS_CONTENT: Record<
  ConsultationStatus,
  { label: string; variant: "success" | "brand" | "warning"; dotClassName: string }
> = {
  IN_PROGRESS: {
    label: "Đang khám",
    variant: "success",
    dotClassName: "bg-success",
  },
  WAITING_LAB: {
    label: "Chờ kết quả CLS",
    variant: "brand",
    dotClassName: "bg-primary",
  },
  PAUSED: {
    label: "Tạm dừng",
    variant: "warning",
    dotClassName: "bg-warning",
  },
};

function getGenderLabel(gender: ConsultationSession["patientGender"]): string {
  return gender === "FEMALE" ? "Nữ" : "Nam";
}

export function ConsultationTable({ sessions }: ConsultationTableProps) {
  if (sessions.length === 0) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="text-body font-semibold text-foreground">
          Không có phiên khám nào phù hợp
        </p>
        <p className="mt-1 text-caption text-muted">
          Thử thay đổi trạng thái hoặc từ khóa tìm kiếm.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table className="min-w-[760px]">
          <TableHeader>
            <TableRow className="bg-secondary/40 hover:bg-secondary/40">
              <TableHead className="px-4 py-2.5 uppercase">Bệnh nhân</TableHead>
              <TableHead className="px-4 py-2.5 uppercase">Phiên khám</TableHead>
              <TableHead className="px-4 py-2.5 uppercase">Trạng thái</TableHead>
              <TableHead className="px-4 py-2.5 uppercase">Ngày / Ca</TableHead>
              <TableHead className="px-4 py-2.5 text-right uppercase">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session) => {
              const status = STATUS_CONTENT[session.status];
              return (
                <TableRow key={session.id} className="hover:bg-item-hover">
                  <TableCell className="px-4 py-3.5">
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground">{session.patientName}</span>
                      <span className="mt-0.5 text-caption text-muted">
                        {session.patientAge} tuổi • {getGenderLabel(session.patientGender)} • {session.patientCode}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">{session.sessionCode}</span>
                      <span className="mt-0.5 text-caption text-muted">
                        STT: {session.queueNumber} • {session.room}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    <Badge variant={status.variant} shape="pill">
                      <span className={cn("size-1.5 rounded-full", status.dotClassName)} />
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-caption text-muted">
                    <span className="whitespace-nowrap">
                      {session.dateLabel} • {session.shiftLabel}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => toast("Chức năng đang được kết nối")}
                      aria-label={`${session.actionLabel} cho ${session.patientName}`}
                      className="whitespace-nowrap text-caption font-semibold text-primary hover:underline"
                    >
                      {session.actionLabel} →
                    </button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-start gap-2 border-t border-border bg-secondary/20 px-4 py-2.5 text-label text-muted">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        <p>
          Các phiên chờ kết quả CLS hoặc đang tạm dừng được hiển thị tại đây khi có dữ liệu và trong phạm vi bác sĩ được phép xem.
        </p>
      </div>
    </>
  );
}
