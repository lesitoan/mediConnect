"use client";

import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { ReceptionStats, ReceptionFilterTab } from "../types/receptionTypes";

interface ReceptionStatsRowProps {
  stats: ReceptionStats;
  activeTab: ReceptionFilterTab;
  onSelectTab: (tab: ReceptionFilterTab) => void;
}

export function ReceptionStatsRow({
  stats,
  activeTab,
  onSelectTab,
}: ReceptionStatsRowProps) {
  const statItems: {
    key: ReceptionFilterTab;
    label: string;
    value: number;
    valueColor?: string;
  }[] = [
    {
      key: "ALL",
      label: "Tổng lịch hẹn",
      value: stats.total,
      valueColor: "text-foreground",
    },
    {
      key: "WAITING_CHECKIN",
      label: "Chờ check-in",
      value: stats.waitingCheckIn,
      valueColor: "text-foreground",
    },
    {
      key: "UPCOMING",
      label: "Sắp đến",
      value: stats.upcoming,
      valueColor: "text-primary",
    },
    {
      key: "LATE",
      label: "Trễ hẹn",
      value: stats.late,
      valueColor: stats.late > 0 ? "text-error" : "text-foreground",
    },
    {
      key: "CHECKED_IN",
      label: "Đã check-in",
      value: stats.checkedIn,
      valueColor: "text-success",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {statItems.map((item) => {
        const isSelected = activeTab === item.key;

        return (
          <Card
            key={item.key}
            onClick={() => onSelectTab(item.key)}
            className={cn(
              "cursor-pointer rounded-app-xl p-3.5 transition-all duration-150 select-none",
              isSelected
                ? "border-primary bg-primary-light/30 shadow-xs ring-1 ring-primary"
                : "border-border-strong/80 bg-surface shadow-xs hover:border-primary/50 hover:bg-surface-hover"
            )}
          >
            <div className="flex flex-col">
              <span
                className={cn(
                  "text-heading font-bold tracking-tight tabular-nums sm:text-title",
                  item.valueColor
                )}
              >
                {item.value}
              </span>
              <span className="mt-0.5 text-caption font-medium text-muted">
                {item.label}
              </span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
