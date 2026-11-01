import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/Card";
import { QUEUE_ACTION_LABELS } from "../constants";
import { getQueueAction, getQueueSubtitle } from "../utils";
import type { QueueAction, QueueItem } from "../types/queueTypes";

interface QueueCardProps {
  item: QueueItem;
  secondsToSkip: number;
  onDetails: (item: QueueItem) => void;
  onAction: (item: QueueItem, action: QueueAction) => void;
}

export function QueueCard({
  item,
  secondsToSkip,
  onDetails,
  onAction,
}: QueueCardProps) {
  const actions = getQueueAction(item);
  const callDisabled = !item.canCall;

  return (
    <Card className="overflow-hidden shadow-none hover:border-border-strong">
      <button
        type="button"
        onClick={() => onDetails(item)}
        aria-label={`Chi tiết lượt ${item.queueDisplayNumber ?? ""} của ${item.patientName}`}
        className="block w-full p-4 pb-3 text-left outline-none transition-colors hover:bg-item-hover/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
      >
        <span className="block text-heading leading-tight font-bold text-foreground">
          {item.queueDisplayNumber ?? "—"}
        </span>
        <span className="mt-1 block text-body font-semibold text-foreground">
          {item.patientName}
        </span>
        <span className="mt-0.5 block text-caption text-muted">
          {getQueueSubtitle(item)}
        </span>
        {item.status === "SKIPPED" && (
          <span className="mt-2 block text-caption font-semibold text-warning">
            Lần bỏ qua thứ {item.nextSkipCount}
          </span>
        )}
      </button>
      <div className="mx-4 flex flex-wrap items-center gap-3 border-t border-border/60 py-2">
        {actions.map((action) => {
          const isCall = action === "CALL";
          const isStart = action === "START";
          const isComplete = action === "COMPLETE";
          const isSkip = action === "SKIP";
          const isSkipDisabled = isSkip && secondsToSkip > 0;
          const reason = isCall
            ? item.cannotCallReason
            : isStart
              ? item.cannotStartReason
              : isComplete
                ? item.cannotCompleteReason
                : item.cannotSkipReason;
          const isDisabled =
            (isCall && callDisabled) ||
            (isStart && !item.canStart) ||
            (isComplete && !item.canComplete) ||
            (isSkip && (!item.canSkip || isSkipDisabled));
          return (
            <div key={action} className="flex flex-col">
              <Button
                type="button"
                variant={action === "SKIP" ? "link" : "outline"}
                className="h-auto min-h-9 px-2 py-1 text-body"
                disabled={isDisabled}
                title={
                  isDisabled ? (item.cannotCallReason ?? undefined) : undefined
                }
                aria-describedby={
                  isDisabled
                    ? `queue-call-reason-${item.careSessionId}`
                    : undefined
                }
                onClick={() => onAction(item, action)}
              >
                {isSkipDisabled
                  ? `Bỏ qua lượt (còn ${secondsToSkip} giây)`
                  : QUEUE_ACTION_LABELS[action]}
              </Button>
              {isDisabled && (
                <span
                  id={`queue-call-reason-${item.careSessionId}`}
                  className="max-w-48 text-caption text-muted"
                >
                  {reason}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
