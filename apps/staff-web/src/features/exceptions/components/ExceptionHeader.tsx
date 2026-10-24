import { Button } from "@/components/ui/button";

interface ExceptionHeaderProps {
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function ExceptionHeader({
  isRefreshing,
  onRefresh,
}: ExceptionHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="space-y-1">
        <h1 className="text-display font-bold tracking-tight text-foreground">
          Xử lý ngoại lệ
        </h1>
      </div>
      
    </div>
  );
}
