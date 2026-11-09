"use client";

import { FilterSearchInput } from "@/components/shared/FilterSearchInput";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { Select } from "@/components/ui/Select";
import { PAYMENT_STATUS_LABELS } from "../invoiceUtils";
import type { InvoiceFilterValues } from "../types/invoiceTypes";

interface InvoiceFiltersProps {
  filters: InvoiceFilterValues;
  isInvoiceTab: boolean;
  onChange: (filters: Partial<InvoiceFilterValues>) => void;
  onReset: () => void;
}

export function InvoiceFilters({
  filters,
  isInvoiceTab,
  onChange,
  onReset,
}: InvoiceFiltersProps) {
  return (
    <div className="rounded-app-xl border border-border-strong bg-surface p-4 shadow-xs">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="w-full sm:min-w-48 sm:flex-1">
          <FilterSearchInput
            value={filters.search}
            onChange={(search) => onChange({ search })}
            placeholder={
              isInvoiceTab
                ? "Mã hóa đơn, tên, mã hoặc SĐT bệnh nhân..."
                : "Mã lịch hẹn, tên, mã hoặc SĐT bệnh nhân..."
            }
            maxLength={100}
          />
        </div>
        <DateRangePicker
          value={{ startDate: filters.from, endDate: filters.to }}
          onChange={({ startDate, endDate }) =>
            onChange({ from: startDate, to: endDate })
          }
          placeholder={isInvoiceTab ? "Ngày lập hóa đơn" : "Ngày hoàn tất khám"}
          presetDirection="PAST"
          className="w-full min-w-0 sm:w-60 sm:shrink-0"
          triggerClassName="h-9.5 w-full"
        />
        {isInvoiceTab && (
          <>
            <div className="w-full sm:w-44 sm:shrink-0">
              <Select
                value={filters.paymentStatus}
                aria-label="Trạng thái thanh toán"
                onChange={(event) =>
                  onChange({
                    paymentStatus: event.target
                      .value as InvoiceFilterValues["paymentStatus"],
                  })
                }
                className="h-9.5"
              >
                <option value="ALL">Tất cả thanh toán</option>
                {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="w-full sm:w-40 sm:shrink-0">
              <Select
                value={filters.status}
                aria-label="Trạng thái hóa đơn"
                onChange={(event) =>
                  onChange({
                    status: event.target.value as InvoiceFilterValues["status"],
                  })
                }
                className="h-9.5"
              >
                <option value="ALL">Tất cả hóa đơn</option>
                <option value="OPEN">Đang sử dụng</option>
                <option value="VOID">Đã hủy</option>
              </Select>
            </div>
          </>
        )}
        <Button
          variant="ghost"
          type="button"
          size="sm"
          className="h-9.5 shrink-0"
          onClick={onReset}
        >
          Xóa bộ lọc
        </Button>
      </div>
    </div>
  );
}
