import type { ScheduleStatistics } from "../types/scheduleTypes";

interface ScheduleWeeklyGridFooterProps {
  statistics: ScheduleStatistics;
}

export function ScheduleWeeklyGridFooter({
  statistics,
}: ScheduleWeeklyGridFooterProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-secondary/30 px-5 py-3">
      <div className="flex flex-wrap items-center gap-2 text-caption">
        <span className="font-bold text-foreground">
          {statistics.totalShifts} quy tắc lịch
        </span>
        <span className="text-muted">•</span>
        <span className="font-semibold text-success">
          {statistics.publishedShifts} đã công bố
        </span>
        <span className="text-muted">•</span>
        <span className="font-semibold text-muted">
          {statistics.draftShifts} nháp
        </span>
      </div>
    </div>
  );
}
