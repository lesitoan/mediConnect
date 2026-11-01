"use client";
import { CalendarDays, List, Search } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/Popover";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Empty } from "@/components/ui/Empty";
import { Select } from "@/components/ui/Select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Pagination } from "@/components/shared/Pagination";
import { useTableFilters } from "@/hooks/useTableFilters";
import { useExaminations } from "../hooks/useExaminations";
import { EXAMINATION_FILTERS, EXAMINATION_STATUS } from "../constants";
import { filterExaminations } from "../examinationUtils";
import { ExaminationSession } from "./ExaminationSession";
export function ExaminationManagementView() {
  const { items, update } = useExaminations();
  const { filters, setFilter, resetFilters } = useTableFilters(
    EXAMINATION_FILTERS,
    "replace",
  );
  const setSelectedId = (id: string | null) => setFilter("visit", id ?? "");
  const selected = items.find((item) => item.id === filters.visit);
  const listedItems = items.filter((item) => !item.isQueueOnly);
  const filtered = filterExaminations(listedItems, filters);
  const pageSize = [7, 10, 20].includes(filters.pageSize)
    ? filters.pageSize
    : 7;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(totalPages, Math.max(1, Math.floor(filters.page) || 1));
  const current = listedItems.find((item) => item.status === "IN_PROGRESS");
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {selected ? (
        <ExaminationSession
          key={selected.id}
          item={selected}
          onBack={() => setSelectedId(null)}
          onUpdate={(changes) => update(selected.id, changes)}
        />
      ) : (
        <>
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-display font-bold text-foreground">
                Khám bệnh ngoại trú
              </h1>
              <p className="mt-1 text-body text-muted">
                Quản lý các phiên khám trong ca làm việc
              </p>
            </div>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/examinations/queue" />}
            >
              <List className="size-4" /> Hàng chờ khám
            </Button>
          </header>
          <section
            aria-labelledby="current-examination"
            className="min-h-40 rounded-app-xl border border-border bg-surface p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <h2
                id="current-examination"
                className="text-body font-semibold text-foreground"
              >
                Phiên khám đang thực hiện
              </h2>
              <span className="text-caption text-muted">
                Theo trạng thái thực tế
              </span>
            </div>
            {current ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-heading font-bold text-foreground">
                    {current.patientName}
                  </p>
                  <p className="mt-1 text-caption text-muted">
                    {current.id} · {current.queueNumber} · {current.room}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-success-bg px-3 py-1 text-caption font-semibold text-success">
                    Đang khám
                  </span>
                  <Button onClick={() => setSelectedId(current.id)}>
                    Tiếp tục →
                  </Button>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-body text-muted">
                Không có phiên khám đang thực hiện.
              </p>
            )}
          </section>
          <section
            aria-label="Bộ lọc phiên khám"
            className="rounded-app-xl border border-border-strong bg-surface p-4 shadow-xs"
          >
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-12">
              <div className="relative sm:col-span-2 lg:col-span-6">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <Input
                  className="h-9.5 pl-9"
                  aria-label="Tìm phiên khám"
                  placeholder="Tìm bệnh nhân, mã phiên khám..."
                  value={filters.search}
                  onChange={(event) => setFilter("search", event.target.value)}
                />
              </div>
              <div className="lg:col-span-3">
                <Popover>
                  <PopoverTrigger
                    render={
                      <Button
                        variant="outline"
                        className="h-9.5 w-full justify-start text-body font-medium"
                        aria-label="Lọc theo ngày khám"
                      />
                    }
                  >
                    <CalendarDays className="size-4 shrink-0 text-muted" />
                    {filters.date
                      ? filters.date.split("-").reverse().join("/")
                      : "Tất cả ngày khám"}
                  </PopoverTrigger>
                  <PopoverContent>
                    <label
                      htmlFor="examination-date"
                      className="text-caption text-muted"
                    >
                      Ngày khám
                    </label>
                    <Input
                      id="examination-date"
                      type="date"
                      value={filters.date}
                      onChange={(event) =>
                        setFilter("date", event.target.value)
                      }
                    />
                    <Button
                      className="mt-2"
                      variant="ghost"
                      onClick={() => setFilter("date", "")}
                    >
                      Tất cả ngày
                    </Button>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="lg:col-span-3">
                <Select
                  aria-label="Trạng thái phiên khám"
                  value={filters.status}
                  onChange={(event) => setFilter("status", event.target.value)}
                  className="h-9.5"
                >
                  {[
                    { value: "ALL", label: "Tất cả trạng thái" },
                    ...Object.entries(EXAMINATION_STATUS)
                      .filter(([value]) => value !== "COMPLETED")
                      .map(([value, status]) => ({
                        value,
                        label: status.label,
                      })),
                  ].map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label} (
                      {
                        listedItems.filter(
                          (item) =>
                            status.value === "ALL" ||
                            item.status === status.value,
                        ).length
                      }
                      )
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </section>
          <div>
            <section className="overflow-hidden rounded-app-xl border border-border bg-surface">
              {!filtered.length ? (
                <Empty
                  title="Không tìm thấy phiên khám"
                  description="Thử thay đổi từ khóa, ngày hoặc trạng thái."
                  action={<Button onClick={resetFilters}>Xóa bộ lọc</Button>}
                />
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bệnh nhân</TableHead>
                        <TableHead>Phiên khám</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Ngày / Ca</TableHead>
                        <TableHead className="text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered
                        .slice((page - 1) * pageSize, page * pageSize)
                        .map((item) => (
                          <TableRow key={item.id} className="h-24">
                            <TableCell className="max-w-40">
                              <p className="max-w-28 font-semibold">
                                {item.patientName}
                              </p>
                              <p className="mt-1 text-caption text-muted">
                                {item.patientCode} · {item.demographics}
                              </p>
                            </TableCell>
                            <TableCell>
                              <p className="font-semibold">{item.id}</p>
                              <p className="mt-1 text-caption text-muted">
                                {item.queueNumber} · {item.room}
                              </p>
                            </TableCell>
                            <TableCell>
                              <span
                                className={`whitespace-nowrap rounded-full px-2.5 py-1 text-caption font-semibold ${EXAMINATION_STATUS[item.status].className}`}
                              >
                                {EXAMINATION_STATUS[item.status].label}
                              </span>
                            </TableCell>
                            <TableCell>
                              <p className="whitespace-nowrap text-caption text-muted">
                                Hôm nay · {item.shift}
                              </p>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                className="px-0 text-caption font-medium text-primary"
                                onClick={() => setSelectedId(item.id)}
                              >
                                {item.status === "COMPLETED"
                                  ? "Xem phiên khám"
                                  : item.status === "WAITING_RESULTS"
                                    ? "Xem KQ & Tiếp tục →"
                                    : "Tiếp tục khám →"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                  <p className="border-t border-border px-5 py-3 text-caption text-muted">
                    Các phiên chờ kết quả CLS vẫn thuộc ca khám hiện tại. Không
                    tạo phiên khám mới khi tiếp tục.
                  </p>
                </>
              )}
            </section>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={filtered.length}
              pageSize={pageSize}
              pageSizeOptions={[7, 10, 20]}
              itemName="phiên khám"
              onPageChange={(value) => setFilter("page", value)}
              hasPageSize={false}
              className="border-0 bg-transparent px-1 text-caption"
            />
          </div>
        </>
      )}
    </div>
  );
}
