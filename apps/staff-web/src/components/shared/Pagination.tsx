"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select } from "@/components/ui/Select";
import { DEFAULT_PAGE_SIZE_OPTIONS } from "@/constants/constants";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize?: number;
  pageSizeOptions?: readonly number[] | number[];
  itemName?: string;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  className?: string;

  /** Hiển thị phần tóm tắt số lượng mục: */
  hasItemCount?: boolean;
  /** Hiển thị dropdown chọn số lượng mục trên mỗi trang*/
  hasPageSize?: boolean;
  /** Hiển thị các nút điều hướng chuyển trang */
  hasNavigation?: boolean;

  shouldShowItemCount?: boolean;
  shouldShowPageSize?: boolean;
  shouldShowNavigation?: boolean;

  showItemCount?: boolean;
  showPageSize?: boolean;
  showNavigation?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  itemName = "mục",
  onPageChange,
  onPageSizeChange,
  className,
  hasItemCount,
  hasPageSize,
  hasNavigation,
  shouldShowItemCount,
  shouldShowPageSize,
  shouldShowNavigation,
  showItemCount,
  showPageSize,
  showNavigation,
}: PaginationProps) {
  const isItemCountVisible =
    hasItemCount ?? shouldShowItemCount ?? showItemCount ?? true;
  const isPageSizeVisible =
    (hasPageSize ?? shouldShowPageSize ?? showPageSize ?? true) &&
    pageSize !== undefined &&
    onPageSizeChange !== undefined;
  const isNavigationVisible =
    hasNavigation ?? shouldShowNavigation ?? showNavigation ?? true;

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * (pageSize ?? 1) + 1;
  const endItem = pageSize ? Math.min(currentPage * pageSize, totalItems) : totalItems;

  const resolvedPageSizeOptions = React.useMemo(() => {
    const list = [...pageSizeOptions];
    if (pageSize && !list.includes(pageSize)) {
      list.push(pageSize);
      list.sort((a, b) => a - b);
    }
    return list;
  }, [pageSizeOptions, pageSize]);

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

  const hasLeftContent = isItemCountVisible || isPageSizeVisible;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-t border-border bg-sidebar/50 px-4 py-3 sm:flex-row sm:items-center",
        hasLeftContent ? "sm:justify-between" : "sm:justify-end",
        className
      )}
    >
      {hasLeftContent && (
        <div className="flex flex-wrap items-center gap-2.5 text-body">
          {isItemCountVisible && (
            <div className="text-muted">
              Hiển thị{" "}
              <span className="font-bold text-foreground tabular-nums">
                {startItem} – {endItem}
              </span>{" "}
              /{" "}
              <span className="font-bold text-foreground tabular-nums">
                {totalItems}
              </span>{" "}
              {itemName}
            </div>
          )}

          {isItemCountVisible && isPageSizeVisible && (
            <div className="hidden h-3.5 w-px bg-border sm:block" />
          )}

          {isPageSizeVisible && (
            <div className="flex items-center gap-1.5">
              <span className="text-muted">Hiển thị</span>
              <Select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                wrapperClassName="w-[110px]"
                className="h-8 px-2.5 py-1 text-body font-medium"
              >
                {resolvedPageSizeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt} / trang
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>
      )}

      {isNavigationVisible && (
        <div className="flex items-center gap-1 self-center sm:self-auto">
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className={cn(
              "flex size-8 items-center justify-center rounded-app-md transition-colors",
              currentPage <= 1
                ? "bg-secondary/40 text-muted/40 cursor-not-allowed"
                : "bg-secondary text-primary hover:bg-secondary-hover cursor-pointer"
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
                  className="flex size-8 items-center justify-center text-caption font-semibold text-muted/50 select-none"
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
                  "flex size-8 items-center justify-center rounded-app-md text-caption tabular-nums transition-colors cursor-pointer select-none",
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
                : "bg-secondary text-primary hover:bg-secondary-hover cursor-pointer"
            )}
            aria-label="Trang sau"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
