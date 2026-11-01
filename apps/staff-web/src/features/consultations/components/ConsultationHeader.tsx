"use client";

import Link from "next/link";
import { List } from "lucide-react";

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
      <Link
        href="/queues"
        aria-label="Mở hàng chờ khám"
        className="inline-flex h-9 items-center gap-1.5 self-start rounded-lg border border-border bg-surface px-3.5 text-caption font-semibold text-foreground shadow-2xs transition-colors hover:bg-item-hover md:self-auto"
      >
        <List className="size-4" />
        Hàng chờ khám
      </Link>
    </div>
  );
}
