import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/Card";
import { QUEUE_ACTION_LABELS } from "../constants";
import { getQueueAction, getQueueSubtitle } from "../utils";
import type { QueueAction, QueueItem } from "../types/queueTypes";

interface QueueCardProps {
  item: QueueItem;
  onDetails: (item: QueueItem) => void;
  onAction: (item: QueueItem, action: QueueAction) => void;
}

export function QueueCard({ item, onDetails, onAction }: QueueCardProps) {
  const action = getQueueAction(item.status);

  return (
    <Card className="overflow-hidden shadow-none hover:border-border-strong">
      <button
        type="button"
        onClick={() => onDetails(item)}
        aria-label={`Chi tiết lượt ${item.queueNumber} của ${item.patientName}`}
        className="block w-full p-4 pb-3 text-left outline-none transition-colors hover:bg-item-hover/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
      >
        <span className="block text-heading leading-tight font-bold text-foreground">
          {item.queueNumber}
        </span>
        <span className="mt-1 block text-body font-semibold text-foreground">
          {item.patientName}
        </span>
        <span className="mt-0.5 block text-caption text-muted">
          {getQueueSubtitle(item)}
        </span>
      </button>
      <div className="mx-4 border-t border-border/60 py-2">
        <Button
          type="button"
          variant="link"
          className={
            action === "SKIP"
              ? "h-auto px-0 py-1 text-body text-muted"
              : "h-auto px-0 py-1 text-body"
          }
          onClick={() => (action ? onAction(item, action) : onDetails(item))}
          aria-label={`${action ? QUEUE_ACTION_LABELS[action] : "Xem trạng thái"} · ${item.queueNumber}`}
        >
          {action ? QUEUE_ACTION_LABELS[action] : "Xem trạng thái"}
        </Button>
      </div>
    </Card>
  );
}
