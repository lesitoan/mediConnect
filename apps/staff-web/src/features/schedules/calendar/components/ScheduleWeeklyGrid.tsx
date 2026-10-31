"use client";

import type {
  DoctorScheduleRow,
  ScheduleStatistics,
} from "../types/scheduleTypes";
import { cn } from "@/lib/utils";
import { formatScheduleDate } from "../utils";
import { ScheduleShiftCard } from "./ScheduleShiftCard";
import { ScheduleWeeklyGridFooter } from "./ScheduleWeeklyGridFooter";

interface ScheduleWeeklyGridProps {
  dates: string[];
  schedules: DoctorScheduleRow[];
  statistics: ScheduleStatistics;
  totalDoctors: number;
}

export function ScheduleWeeklyGrid({
  dates,
  schedules,
  statistics,
  totalDoctors,
}: ScheduleWeeklyGridProps) {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return (
    <>
      <div className="w-full overflow-x-auto">
        <div style={{ minWidth: 220 + dates.length * 148 }}>
          <div className="flex border-b border-border bg-secondary/40 text-caption font-semibold text-muted">
            <div className="flex w-[220px] shrink-0 items-center justify-between px-3.5 py-3">
              <span className="font-bold text-foreground">
                Bác sĩ / Chuyên khoa
              </span>
              <span className="text-label font-normal text-muted">
                {totalDoctors}
              </span>
            </div>
            {dates.map((date) => (
              <div
                key={date}
                data-schedule-date={date}
                className={cn(
                  "flex min-w-0 flex-1 flex-wrap items-center justify-between gap-1 border-l border-border px-3.5 py-3",
                  date === today &&
                    "border-primary/20 bg-brand-secondary-light/40 text-primary",
                )}
              >
                <span className="capitalize">{formatScheduleDate(date)}</span>
                {date === today && (
                  <span className="rounded-app-sm bg-primary px-1.5 py-0.5 text-label font-semibold text-primary-foreground">
                    Hôm nay
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="divide-y divide-border">
            {schedules.map((row) => (
              <div
                key={row.scheduleId}
                className="flex items-stretch transition-colors hover:bg-secondary/20"
              >
                <div className="flex w-[220px] shrink-0 items-center gap-2.5 px-3.5 py-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-label font-bold text-primary-foreground shadow-2xs">
                    {row.initials}
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-body font-semibold text-foreground">
                      {row.doctorName}
                    </span>
                    <div className="flex items-center gap-1.5 text-caption">
                      <span className="font-mono font-medium text-primary">
                        {row.doctorCode}
                      </span>
                      <span className="text-muted">•</span>
                      <span className="truncate text-muted">
                        {row.specialtyName}
                      </span>
                    </div>
                  </div>
                </div>
                {dates.map((date) => {
                  const shift =
                    Object.values(row.shifts).find(
                      (shift) => shift?.date === date,
                    ) ?? null;
                  return (
                    <div
                      key={date}
                      className={cn(
                        "flex min-w-0 flex-1 flex-col justify-center border-l border-border p-2",
                        date === today &&
                          "border-primary/20 bg-brand-secondary-light/20",
                      )}
                    >
                      <ScheduleShiftCard
                        shift={shift}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <ScheduleWeeklyGridFooter statistics={statistics} />
    </>
  );
}
