"use client";

import {
  Stethoscope,
  Users,
  DoorOpen,
  ArrowRight,
  Baby,
  Activity,
  HeartPulse,
  Sparkles,
  Eye,
  Bone,
  ShieldAlert,
  Plus,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/Card";
import type { Specialty } from "../types/doctorTypes";

interface SpecialtyGridProps {
  specialties: Specialty[];
  onSelectSpecialty?: (specialtyName: string) => void;
  onAddSpecialtyClick?: () => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Baby,
  Activity,
  HeartPulse,
  Sparkles,
  Eye,
  Stethoscope,
  Bone,
  ShieldAlert,
};

export function SpecialtyGrid({
  specialties,
  onSelectSpecialty,
  onAddSpecialtyClick,
}: SpecialtyGridProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-foreground">
          Danh sách chuyên khoa lâm sàng & cận lâm sàng ({specialties.length})
        </h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddSpecialtyClick}
          className="gap-1.5 text-body font-semibold text-primary border-border hover:bg-primary-light"
        >
          <Plus className="size-3.5" />
          <span>Thêm chuyên khoa mới</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {specialties.map((spec) => {
          const IconComponent = ICON_MAP[spec.iconName] || Stethoscope;

          return (
            <Card
              key={spec.id}
              className="flex flex-col justify-between p-3.5 border-border-strong bg-surface transition-all duration-150 hover:shadow-md hover:border-primary/60"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex size-8.5 items-center justify-center rounded-app-lg bg-primary-light text-primary">
                    <IconComponent className="size-4.5" />
                  </div>
                  <Badge variant="neutral" className="font-bold text-caption tabular-nums px-2 py-0.5">
                    {spec.code}
                  </Badge>
                </div>

                <h3 className="mt-2.5 text-doctor font-bold text-foreground">
                  {spec.name}
                </h3>
                <p className="mt-0.5 text-caption text-muted line-clamp-2">
                  {spec.description}
                </p>

                <div className="mt-3 space-y-1.5 rounded-app-md bg-secondary/50 p-2 text-caption">
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Trưởng khoa:</span>
                    <span className="font-semibold text-foreground truncate max-w-[150px]">
                      {spec.headDoctorName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-muted">
                      <Users className="size-3 text-primary" />
                      <span>Nhân sự:</span>
                    </span>
                    <span className="font-bold text-primary tabular-nums">
                      {spec.doctorCount} bác sĩ
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-muted">
                      <DoorOpen className="size-3 text-success" />
                      <span>Phòng khám:</span>
                    </span>
                    <span className="font-semibold text-success tabular-nums">
                      {spec.activeRooms} phòng hoạt động
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 border-t border-border pt-2.5">
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={() => onSelectSpecialty?.(spec.name)}
                  className="w-full justify-between p-0 h-auto text-body font-semibold text-primary"
                >
                  <span>Xem danh sách bác sĩ</span>
                  <ArrowRight className="size-3" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
