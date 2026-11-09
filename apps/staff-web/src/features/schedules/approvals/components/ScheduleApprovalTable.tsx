"use client";

import { ChevronRight as ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/Table";
import type { ApprovalRequest } from "../types/approvalTypes";
import {
  getApprovalStatusBadgeVariant,
  getApprovalStatusLabel,
  getApprovalTypeLabel,
} from "../utils";

interface ScheduleApprovalTableProps {
  requests: ApprovalRequest[];
  onOpenReviewModal: (request: ApprovalRequest) => void;
}

export function ScheduleApprovalTable({
  requests,
  onOpenReviewModal,
}: ScheduleApprovalTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[35%] px-6 py-3.5">
            Yêu cầu & Bác sĩ
          </TableHead>
          <TableHead className="w-[25%] px-6 py-3.5">Loại yêu cầu</TableHead>
          <TableHead className="w-[22%] px-6 py-3.5">Ngày / Ca</TableHead>
          <TableHead className="w-[18%] px-6 py-3.5">
            Trạng thái & Xử lý
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((req) => (
          <TableRow
            key={req.id}
            className="relative transition-colors hover:bg-secondary/40"
          >
            <TableCell className="relative px-6 py-4">
              {req.isUrgent && (
                <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r bg-danger" />
              )}
              <div className="flex flex-col gap-0.5">
                <span className="font-mono text-label font-medium text-muted">
                  {req.requestCode} · {req.doctorCode}
                </span>
                <span className="text-body font-bold text-foreground">
                  {req.doctorName}
                </span>
                <span className="text-caption text-muted">
                  {req.specialtyName}
                </span>
              </div>
            </TableCell>
            <TableCell className="px-6 py-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-caption font-semibold text-foreground">
                  {getApprovalTypeLabel(req.type)}
                </span>
                <span className="text-caption text-muted">{req.reason}</span>
              </div>
            </TableCell>
            <TableCell className="px-6 py-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-caption font-medium text-foreground">
                  {req.date}
                </span>
                <span className="text-caption text-muted">{req.shiftTime}</span>
              </div>
            </TableCell>
            <TableCell className="px-6 py-4">
              <div className="flex flex-col gap-1.5">
                <Badge
                  variant={getApprovalStatusBadgeVariant(
                    req.status,
                    req.isUrgent,
                  )}
                  size="sm"
                  shape="pill"
                  className="w-fit"
                >
                  {getApprovalStatusLabel(req.status, req.isUrgent)}
                </Badge>

                <button
                  type="button"
                  onClick={() => onOpenReviewModal(req)}
                  className="flex items-center gap-1 text-caption font-semibold text-primary transition-colors hover:underline hover:text-primary-hover"
                >
                  <span>Xem & Xử lý</span>
                  <ArrowRight className="size-3" />
                </button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
