"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function UserPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: UserPaginationProps) {
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
    <div className="flex flex-col gap-3 border-t border-border bg-sidebar/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2.5 text-body">
        <div className="text-muted">
          Hiển thị{" "}
          <span className="font-bold text-foreground tabular-nums">
            {startItem} – {endItem}
          </span>{" "}
          /{" "}
          <span className="font-bold text-foreground tabular-nums">
            {totalItems}
          </span>{" "}
          tài khoản
        </div>

        <div className="hidden h-3.5 w-px bg-border sm:block" />

        <div className="flex items-center gap-1.5">
          <span className="text-muted">Hiển thị</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded-app-sm border border-border bg-surface px-2 py-0.5 text-body font-semibold text-foreground outline-none cursor-pointer hover:bg-surface-hover"
          >
            <option value={7}>7 / trang</option>
            <option value={10}>10 / trang</option>
            <option value={20}>20 / trang</option>
            <option value={50}>50 / trang</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-1 self-center sm:self-auto">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={cn(
            "flex size-8 items-center justify-center rounded-app-md transition-colors",
            currentPage <= 1
              ? "bg-secondary/40 text-muted/40 cursor-not-allowed"
              : "bg-secondary text-primary hover:bg-secondary-hover"
          )}
          aria-label="Trang trước"
        >
          <ChevronLeft className="size-4" />
        </button>

        {getPageNumbers().map((page, index) => {
          if (typeof page === "string") {
            return (
              <span
                key={`ellipsis-${index}`}
                className="flex size-8 items-center justify-center text-body font-semibold text-muted/50 select-none"
              >
                ...
              </span>
            );
          }

          const isActive = page === currentPage;
          return (
            <button
              key={`page-${page}`}
              type="button"
              onClick={() => onPageChange(page)}
              className={cn(
                "flex size-8 items-center justify-center rounded-app-md text-body tabular-nums transition-colors",
                isActive
                  ? "bg-primary font-bold text-primary-foreground shadow-xs"
                  : "font-semibold text-muted hover:bg-secondary hover:text-foreground"
              )}
            >
              {page}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={cn(
            "flex size-8 items-center justify-center rounded-app-md transition-colors",
            currentPage >= totalPages
              ? "bg-secondary/40 text-muted/40 cursor-not-allowed"
              : "bg-secondary text-primary hover:bg-secondary-hover"
          )}
          aria-label="Trang sau"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
