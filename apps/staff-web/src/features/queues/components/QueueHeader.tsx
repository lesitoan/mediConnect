import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";

interface QueueHeaderProps {
  date: string;
  isRefreshing: boolean;
  onDateChange: (date: string) => void;
  onRefresh: () => void;
}

export function QueueHeader({
  date,
  isRefreshing,
  onDateChange,
  onRefresh,
}: QueueHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <h1 className="text-display font-bold tracking-tight text-foreground">
        Hàng chờ khám bệnh
      </h1>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-caption font-medium text-muted">
          Ngày khám
          <Input
            type="date"
            value={date}
            onChange={(event) => onDateChange(event.target.value)}
          />
        </label>
        <Button
          type="button"
          variant="outline"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? "Đang làm mới..." : "Làm mới"}
        </Button>
      </div>
    </div>
  );
}
