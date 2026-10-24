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
          {statistics.totalShifts} ca
        </span>
        <span className="text-muted">•</span>
        <span className="font-semibold text-success">
          {statistics.publishedShifts} đã công bố
        </span>
        <span className="text-muted">•</span>
        <span className="font-semibold text-muted">
          {statistics.draftShifts} nháp
        </span>
        <span className="text-muted">•</span>
        <span className="font-bold text-danger">
          {statistics.conflictCount} xung đột
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-caption font-medium text-foreground">
          Tỷ lệ phủ lịch:{" "}
          <strong className="text-primary font-bold">
            {statistics.coverageRate}%
          </strong>
        </span>
        <div className="h-2 w-24 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${statistics.coverageRate}%` }}
          />
        </div>
      </div>
    </div>
  );
}
