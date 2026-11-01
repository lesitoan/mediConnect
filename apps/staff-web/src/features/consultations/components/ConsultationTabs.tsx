"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { CONSULTATION_TABS } from "../constants";
import { getConsultationStatusCount, getVietnameseTodayLabel } from "../services/consultationService";
import type {
  ConsultationSession,
  ConsultationTab,
} from "../types/consultationTypes";

interface ConsultationTabsProps {
  sessions: readonly ConsultationSession[];
  activeTab: ConsultationTab;
  search: string;
  onTabChange: (tab: ConsultationTab) => void;
  onSearchChange: (search: string) => void;
}

export function ConsultationTabs({
  sessions,
  activeTab,
  search,
  onTabChange,
  onSearchChange,
}: ConsultationTabsProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [localSearch, setLocalSearch] = useState(search);
  const todayLabel = getVietnameseTodayLabel();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (localSearch !== search) onSearchChange(localSearch);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [localSearch, onSearchChange, search]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "F2") {
        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="border-b border-border">
      <div className="flex overflow-x-auto px-3 pt-1 sm:px-4" role="tablist" aria-label="Trạng thái phiên khám">
        {CONSULTATION_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = getConsultationStatusCount(sessions, tab.id);
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(tab.id)}
              className={`relative shrink-0 px-3 py-3 text-caption font-semibold transition-colors ${
                isActive
                  ? "text-primary after:absolute after:right-2 after:bottom-0 after:left-2 after:h-0.5 after:bg-primary"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {tab.label}
              <span
                className={`ml-1.5 rounded-full px-1.5 py-0.5 text-label ${
                  isActive ? "bg-primary-light text-primary" : "bg-secondary text-muted"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex flex-col gap-2.5 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <div className="relative w-full sm:max-w-[252px]">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted" />
          <Input
            ref={searchInputRef}
            type="search"
            value={localSearch}
            onChange={(event) => setLocalSearch(event.target.value)}
            placeholder="Tìm bệnh nhân, mã phiên khám..."
            aria-label="Tìm bệnh nhân hoặc mã phiên khám"
            className="h-9 pl-8 text-caption"
          />
        </div>
        <div className="relative w-full sm:w-auto">
          <CalendarDays className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted" />
          <Select
            aria-label="Ngày khám"
            value="today"
            onChange={() => undefined}
            className="h-9 min-w-full pl-8 text-caption sm:min-w-[206px]"
          >
            <option value="today">Ngày khám: Hôm nay ({todayLabel})</option>
          </Select>
        </div>
      </div>
    </div>
  );
}
