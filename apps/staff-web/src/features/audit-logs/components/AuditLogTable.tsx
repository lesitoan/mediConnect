"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Pagination } from "@/components/shared/Pagination";
import { cn } from "@/lib/utils";
import type { AuditLogEntry } from "../types/auditLogTypes";
import { AUDIT_LOG_PAGE_SIZE_OPTIONS } from "../types/auditLogTypes";

interface AuditLogTableProps {
  logs: AuditLogEntry[];
  totalItems: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSelectLog: (log: AuditLogEntry) => void;
}

export function AuditLogTable({
  logs,
  totalItems,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onSelectLog,
}: AuditLogTableProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Format count like 12.847 (Vietnamese number format)
  const formattedTotal = totalItems.toLocaleString("vi-VN");

  return (
    <div className="space-y-3">
      {/* Table Metadata Bar */}
      <div className="flex items-center justify-between px-1 text-body">
        <span className="font-bold text-foreground">
          {formattedTotal} bản ghi
        </span>
        <span className="text-caption text-muted">
          Tự làm mới: 30 giây
        </span>
      </div>

      {/* Main Table Card */}
      <div className="overflow-hidden rounded-app-xl border border-border bg-surface shadow-xs">
        <Table>
          <TableHeader className="bg-secondary/35 border-b border-border">
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="w-[180px] py-3 text-caption font-bold tracking-wider text-muted uppercase">
                THỜI GIAN
              </TableHead>
              <TableHead className="w-[220px] py-3 text-caption font-bold tracking-wider text-muted uppercase">
                NGƯỜI THỰC HIỆN
              </TableHead>
              <TableHead className="py-3 text-caption font-bold tracking-wider text-muted uppercase">
                HÀNH ĐỘNG
              </TableHead>
              <TableHead className="w-[160px] py-3 text-caption font-bold tracking-wider text-muted uppercase">
                ĐỐI TƯỢNG
              </TableHead>
              <TableHead className="w-[140px] py-3 text-caption font-bold tracking-wider text-muted uppercase">
                KẾT QUẢ
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-12 text-center text-caption text-muted"
                >
                  Không tìm thấy bản ghi nhật ký phù hợp với bộ lọc hiện tại.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => {
                const isSuccess = log.result === "SUCCESS";
                const isFailed = log.result === "FAILED";

                return (
                  <TableRow
                    key={log.id}
                    onClick={() => onSelectLog(log)}
                    className="cursor-pointer transition-colors hover:bg-item-hover border-border"
                  >
                    {/* Cột 1: THỜI GIAN */}
                    <TableCell className="py-3.5">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground text-body leading-snug">
                          {log.date}
                        </span>
                        <span className="font-mono text-caption text-muted leading-tight">
                          {log.time}
                        </span>
                      </div>
                    </TableCell>

                    {/* Cột 2: NGƯỜI THỰC HIỆN */}
                    <TableCell className="py-3.5 font-medium text-foreground text-body">
                      {log.executor}
                    </TableCell>

                    {/* Cột 3: HÀNH ĐỘNG */}
                    <TableCell className="py-3.5 text-foreground text-body font-normal">
                      {log.action}
                    </TableCell>

                    {/* Cột 4: ĐỐI TƯỢNG */}
                    <TableCell className="py-3.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectLog(log);
                        }}
                        className={cn(
                          "font-bold text-body hover:underline text-left cursor-pointer",
                          log.isTargetDanger
                            ? "text-destructive"
                            : "text-primary"
                        )}
                      >
                        {log.target}
                      </button>
                    </TableCell>

                    {/* Cột 5: KẾT QUẢ */}
                    <TableCell className="py-3.5">
                      <span
                        className={cn(
                          "font-semibold text-body",
                          isSuccess
                            ? "text-success"
                            : isFailed
                              ? "text-destructive"
                              : "text-foreground"
                        )}
                      >
                        {log.resultLabel}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination Bar */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          pageSizeOptions={AUDIT_LOG_PAGE_SIZE_OPTIONS}
          itemName="bản ghi"
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </div>
    </div>
  );
}
