"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/Empty";
import { Loading } from "@/components/shared/Loading";
import { getVietnamDate } from "@/lib/dateUtils";
import { useGetMyScheduleMatrixQuery } from "../services/schedulesApi";
import type { ScheduleDateRange } from "../types/scheduleTypes";
import { LeaveRequestDialog } from "./LeaveRequestDialog";

interface MyScheduleCalendarProps {
  user: {
    id: string;
    name?: string;
    role: string;
  };
}

const WEEKDAY_LABELS = [
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
  "CN",
];
const MONTH_FORMATTER = new Intl.DateTimeFormat("vi-VN", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const DAY_FORMATTER = new Intl.DateTimeFormat("vi-VN", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});
const SHIFT_TIME_FORMATTER = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function getMonthRange(monthKey: string): ScheduleDateRange {
  const [year, month] = monthKey.split("-").map(Number);
  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd = new Date(Date.UTC(year, month, 0));
  return {
    startDate: monthStart.toISOString().slice(0, 10),
    endDate: monthEnd.toISOString().slice(0, 10),
  };
}

function shiftMonth(monthKey: string, offset: number) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1 + offset, 1))
    .toISOString()
    .slice(0, 7);
}

function formatMonth(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return MONTH_FORMATTER.format(new Date(Date.UTC(year, month - 1, 1)));
}

function getCalendarDays(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const count = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const firstDay = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const offset = (firstDay + 6) % 7;
  const cellCount = Math.ceil((offset + count) / 7) * 7;
  return {
    count,
    offset,
    cellCount,
    dates: Array.from({ length: cellCount }, (_, index) => {
      const day = index - offset + 1;
      return day > 0 && day <= count
        ? new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10)
        : null;
    }),
  };
}

function getShiftStatusLabel(status: string) {
  switch (status) {
    case "ABSENT":
      return "Vắng";
    case "RESOLVING":
      return "Chờ xử lý";
    case "DRAFT":
      return "Bản nháp";
    default:
      return "Có lịch";
  }
}

function getShiftTimeRange(startsAt: string, endsAt: string) {
  return `${SHIFT_TIME_FORMATTER.format(new Date(startsAt))}–${SHIFT_TIME_FORMATTER.format(new Date(endsAt))}`;
}

export function MyScheduleCalendar({ user }: MyScheduleCalendarProps) {
  const [monthKey, setMonthKey] = useState(() => getVietnamDate().slice(0, 7));
  const dateRange = useMemo(() => getMonthRange(monthKey), [monthKey]);
  const { currentData, isLoading, isFetching, isError, refetch } =
    useGetMyScheduleMatrixQuery(dateRange);
  const { dates, cellCount } = useMemo(
    () => getCalendarDays(monthKey),
    [monthKey],
  );
  const [selectedDate, setSelectedDate] = useState(() => getVietnamDate());
  const [leaveRequestType, setLeaveRequestType] = useState<
    "PLANNED_LEAVE" | "URGENT_ABSENCE" | null
  >(null);

  const staff = currentData?.staff.find((item) => item.userId === user.id);
  const shifts =
    staff?.shifts.filter((shift) => shift.date === selectedDate) ?? [];

  const selectedDateLabel = selectedDate
    ? DAY_FORMATTER.format(new Date(`${selectedDate}T00:00:00Z`))
    : "";
  return (
    <section className="flex h-[calc(100dvh-8rem)] min-h-[520px] w-full min-w-0 flex-col gap-3">
      <header className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-title font-bold tracking-tight text-foreground sm:text-display">
            Lịch làm việc của tôi
          </h1>
          <p className="mt-0.5 text-caption text-muted sm:text-body">
            {user.name ?? "Nhân viên"} · Thứ Hai đến Chủ nhật
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setLeaveRequestType("PLANNED_LEAVE")}
          >
            Xin nghỉ phép
          </Button>
          <Button
            type="button"
            onClick={() => setLeaveRequestType("URGENT_ABSENCE")}
          >
            Báo vắng đột xuất
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-app-xl border border-border bg-surface p-3 shadow-2xs sm:p-4">
        <div className="mb-2 flex shrink-0 items-center justify-between gap-2 sm:mb-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-2 text-caption sm:px-3"
            onClick={() => {
              const nextMonth = shiftMonth(monthKey, -1);
              setMonthKey(nextMonth);
              setSelectedDate(getMonthRange(nextMonth).startDate);
            }}
          >
            Tháng trước
          </Button>
          <h2 className="text-body font-semibold capitalize sm:text-title">
            {formatMonth(monthKey)}
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-2 text-caption sm:px-3"
            onClick={() => {
              const nextMonth = shiftMonth(monthKey, 1);
              setMonthKey(nextMonth);
              setSelectedDate(getMonthRange(nextMonth).startDate);
            }}
          >
            Tháng sau
          </Button>
        </div>

        {isLoading ? (
          <Loading
            label="Đang tải lịch cá nhân..."
            className="min-h-0 flex-1"
          />
        ) : isError ? (
          <Empty
            role="alert"
            title="Không thể tải lịch của bạn"
            description="Vui lòng thử lại."
            action={
              <Button
                type="button"
                onClick={() => void refetch()}
                disabled={isFetching}
              >
                Thử lại
              </Button>
            }
          />
        ) : !staff ? (
          <Empty
            role="alert"
            title="API chưa trả về lịch cho tài khoản này"
            description="Hãy kiểm tra quyền truy cập và dữ liệu nhân viên của tài khoản."
            action={
              <Button
                type="button"
                onClick={() => void refetch()}
                disabled={isFetching}
              >
                Tải lại
              </Button>
            }
          />
        ) : (
          <div className="flex min-h-0 flex-1 flex-col" aria-busy={isFetching}>
            <div className="grid shrink-0 grid-cols-7 overflow-hidden rounded-t-app-lg border border-border">
              {WEEKDAY_LABELS.map((label) => (
                <div
                  key={label}
                  className="border-b border-r border-border bg-secondary/50 px-0.5 py-1.5 text-center text-[10px] font-semibold text-muted last:border-r-0 sm:py-2 sm:text-caption"
                >
                  {label}
                </div>
              ))}
            </div>
            <div
              className="grid min-h-0 flex-1 grid-cols-7 overflow-hidden rounded-b-app-lg border-x border-b border-border"
              style={{
                gridTemplateRows: `repeat(${cellCount / 7}, minmax(0, 1fr))`,
              }}
            >
              {dates.map((date, index) => {
                if (!date) {
                  return (
                    <div
                      key={`empty-${index}`}
                      aria-hidden="true"
                      className="border-b border-r border-border bg-secondary/20"
                    />
                  );
                }
                const day = Number(date.slice(-2));
                const dayShifts = staff.shifts.filter(
                  (shift) => shift.date === date,
                );
                const hasAbsence = dayShifts.some(
                  (shift) => shift.status === "ABSENT",
                );
                const isAbsent =
                  dayShifts.length > 0 &&
                  dayShifts.every((shift) => shift.status === "ABSENT");
                const dayStatusLabel =
                  dayShifts.length === 0
                    ? "Không có lịch"
                    : dayShifts.some((shift) => shift.status === "RESOLVING")
                      ? "Chờ xử lý"
                      : isAbsent
                        ? "Vắng"
                        : hasAbsence
                          ? "Có ca vắng"
                          : dayShifts.some(
                                (shift) => shift.status === "PUBLISHED",
                              )
                            ? "Có lịch"
                            : "Bản nháp";
                const isSelected = selectedDate === date;
                return (
                  <button
                    type="button"
                    key={date}
                    aria-pressed={isSelected}
                    onClick={() => setSelectedDate(date)}
                    className={`flex min-h-0 flex-col gap-1 border-b border-r border-border p-1 text-left transition-colors sm:gap-1.5 sm:p-2 ${
                      isSelected
                        ? "bg-primary-light ring-2 ring-inset ring-primary"
                        : hasAbsence
                          ? "bg-destructive/10 hover:bg-destructive/15"
                          : "bg-surface hover:bg-secondary/40"
                    }`}
                  >
                    <span className="text-caption font-semibold leading-4 text-foreground sm:text-body">
                      {day}
                    </span>
                    <span
                      className={`block truncate rounded px-0.5 py-0.5 text-center text-[9px] font-semibold leading-3 sm:px-1 sm:text-caption sm:leading-4 ${
                        hasAbsence
                          ? "bg-destructive text-white"
                          : dayShifts.length
                            ? "bg-primary-light text-primary"
                            : "bg-secondary text-muted"
                      }`}
                    >
                      {dayStatusLabel}
                    </span>
                  </button>
                );
              })}
            </div>
            {selectedDate && (
              <section
                aria-live="polite"
                className="mt-2 grid shrink-0 grid-cols-1 gap-2 sm:mt-3 sm:grid-cols-[minmax(120px,0.8fr)_repeat(2,minmax(0,1fr))] sm:gap-3"
              >
                <div className="flex min-w-0 items-center">
                  <h2 className="truncate text-caption font-semibold capitalize text-foreground sm:text-body">
                    {selectedDateLabel}
                  </h2>
                </div>
                {shifts.length === 0 ? (
                  <p className="text-caption text-muted">
                    Không có ca làm việc.
                  </p>
                ) : (
                  shifts.map((shift) => {
                    const isShiftAbsent = shift.status === "ABSENT";
                    return (
                      <article
                        key={shift.key}
                        className={`flex min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-1 rounded-app-md border px-2 py-1.5 sm:px-3 ${
                          isShiftAbsent
                            ? "border-destructive/30 bg-destructive/10"
                            : "border-border bg-secondary/20"
                        }`}
                      >
                        <div className="min-w-0">
                          <h3 className="truncate text-caption font-semibold text-foreground">
                            Ca làm
                          </h3>
                          <p className="text-[10px] text-muted sm:text-caption">
                            {getShiftTimeRange(shift.startsAt, shift.endsAt)}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 text-[10px] font-semibold sm:text-caption ${
                            isShiftAbsent
                              ? "text-destructive"
                              : shift.status === "RESOLVING"
                                ? "text-warning"
                                : "text-primary"
                          }`}
                        >
                          {getShiftStatusLabel(shift.status)}
                        </span>
                      </article>
                    );
                  })
                )}
              </section>
            )}
          </div>
        )}
      </div>

      {leaveRequestType && (
        <LeaveRequestDialog
          key={leaveRequestType}
          requestType={leaveRequestType}
          onClose={() => setLeaveRequestType(null)}
        />
      )}
    </section>
  );
}
