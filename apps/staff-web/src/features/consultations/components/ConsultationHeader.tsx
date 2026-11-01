"use client";

import Link from "next/link";
import { List } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ConsultationHeader() {
  return (
    <div className="flex flex-col gap-3 pb-1 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <h1 className="text-display font-bold tracking-tight text-foreground">
          Khám bệnh ngoại trú
        </h1>
        <p className="text-caption text-muted">
          Quản lý các phiên khám trong ca làm việc
        </p>
      </div>
      <Button
        asChild
        type="button"
        variant="outline"
        size="sm"
        className="h-9 gap-1.5 self-start px-3.5 text-caption font-semibold md:self-auto"
      >
        <Link href="/queues" aria-label="Mở hàng chờ khám">
          <List className="size-4" />
          Hàng chờ khám
        </Link>
      </Button>
    </div>
  );
}
