import { Empty } from "@/components/ui/Empty";
import { QUEUE_COLUMNS } from "../constants";
import type { QueueAction, QueueItem } from "../types/queueTypes";
import { QueueCard } from "./QueueCard";

interface QueueBoardProps {
  items: QueueItem[];
  onDetails: (item: QueueItem) => void;
  onAction: (item: QueueItem, action: QueueAction) => void;
}

export function QueueBoard({ items, onDetails, onAction }: QueueBoardProps) {
  return (
    <div className="grid items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {QUEUE_COLUMNS.map((column) => {
        const columnItems = items.filter(
          (item) => item.status === column.status,
        );

        return (
          <section
            key={column.status}
            aria-labelledby={`queue-column-${column.status}`}
            className="min-w-0 rounded-app-xl border border-border-strong bg-surface p-4 shadow-xs sm:min-h-[560px]"
          >
            <div className="mb-3.5 flex items-center justify-between gap-3 pb-1">
              <h2
                id={`queue-column-${column.status}`}
                className="text-base font-bold text-foreground"
              >
                {column.label}
              </h2>
              <span
                className="text-caption font-semibold text-muted tabular-nums"
                aria-label={`${columnItems.length} lượt`}
              >
                {String(columnItems.length).padStart(2, "0")}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {columnItems.length > 0 ? (
                columnItems.map((item) => (
                  <QueueCard
                    key={item.id}
                    item={item}
                    onDetails={onDetails}
                    onAction={onAction}
                  />
                ))
              ) : (
                <Empty
                  className="min-h-40 px-2 py-8"
                  description="Chưa có bệnh nhân trong danh sách này."
                />
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
