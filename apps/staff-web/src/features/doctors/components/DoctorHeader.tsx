"use client";

import { User, Stethoscope } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import type { MainTab } from "../types/doctorTypes";

interface DoctorHeaderProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  doctorCount: number;
  specialtyCount: number;
}

export function DoctorHeader({
  activeTab,
  onTabChange,
  doctorCount,
  specialtyCount,
}: DoctorHeaderProps) {
  return (
    <div className="flex flex-col gap-3 pb-3.5 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-display font-bold tracking-tight text-foreground">
            Quản lý Bác sĩ & Chuyên khoa
          </h1>

        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(val) => onTabChange(val as MainTab)}
        className="self-start md:self-auto"
      >
        <TabsList className="rounded-app-lg border-border-strong bg-secondary/80 p-0.5 shadow-xs">
          <TabsTrigger
            value="DOCTORS"
            className="flex items-center gap-1.5 rounded-app-md px-3.5 py-1.5 text-base font-semibold data-[selected]:font-bold data-[selected]:text-primary"
          >
            <User className="size-3.5" />
            <span className="tabular-nums">Bác sĩ ({doctorCount})</span>
          </TabsTrigger>
          <TabsTrigger
            value="SPECIALTIES"
            className="flex items-center gap-1.5 rounded-app-md px-3.5 py-1.5 text-base font-semibold data-[selected]:font-bold data-[selected]:text-primary"
          >
            <Stethoscope className="size-3.5" />
            <span className="tabular-nums">Chuyên khoa ({specialtyCount})</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
