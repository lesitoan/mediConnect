"use client";

import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReceptionHeaderProps {
  onOpenWalkInModal: () => void;
}

export function ReceptionHeader({ onOpenWalkInModal }: ReceptionHeaderProps) {
  return (
    <div className="flex flex-col gap-3 pb-3 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        {/* Breadcrumb */}


        {/* Title & Subtitle */}
        <h1 className="text-display font-bold tracking-tight text-foreground">
          Tiếp nhận & Check-in Bệnh nhân
        </h1>
        <p className="text-caption text-muted">
          Danh sách bệnh nhân trong ngày · Ca sáng (07:30–12:00)
        </p>
      </div>

      {/* Primary Action Button */}
      <div className="flex items-center gap-2 self-start md:self-auto">
        <Button
          id="btn-walk-in-reception"
          type="button"
          variant="default"
          size="sm"
          onClick={onOpenWalkInModal}
          className="h-9 gap-1.5 px-4 text-base font-semibold shadow-xs"
        >
          <UserPlus className="size-4" />
          <span>Tiếp nhận vãng lai [F4]</span>
        </Button>
      </div>
    </div>
  );
}
