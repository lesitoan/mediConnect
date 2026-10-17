"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  itemName?: string;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  itemName = "mục",
  onPageChange,
  className,
}: PaginationProps) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage, "...", totalPages);
      }
    }
    return pages;
  };

  return (
    <div
      className={cn(
        "mt-3.5 flex flex-col gap-2 rounded-app-lg border border-border bg-surface px-3.5 py-2.5 shadow-xs sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="text-caption text-muted">
        Hiển thị{" "}
        <span className="font-bold text-foreground tabular-nums">
          {startItem} – {endItem}
        </span>{" "}
        trong <span className="font-bold text-foreground tabular-nums">{totalItems}</span> {itemName}
      </div>

      <div className="flex items-center gap-1 self-center sm:self-auto">
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="gap-1 border-border font-semibold text-caption h-7 px-2"
        >
          <ChevronLeft className="size-3" />
          <span>Trước</span>
        </Button>

        {getPageNumbers().map((page, idx) => {
          if (typeof page === "string") {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="flex size-7 items-center justify-center text-caption text-muted select-none"
              >
                ...
              </span>
            );
          }

          const isActive = page === currentPage;
          return (
            <Button
              key={`page-${page}`}
              type="button"
              variant={isActive ? "default" : "ghost"}
              size="icon-xs"
              onClick={() => onPageChange(page)}
              className={cn(
                "size-7 rounded-app-sm text-caption font-bold tabular-nums",
                isActive ? "shadow-xs" : "text-muted hover:text-foreground"
              )}
            >
              {page}
            </Button>
          );
        })}

        <Button
          type="button"
          variant="secondary"
          size="xs"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="gap-1 font-semibold text-primary hover:bg-secondary-hover h-7 px-2"
        >
          <span>Sau</span>
          <ChevronRight className="size-3" />
        </Button>
      </div>
    </div>
  );
}
