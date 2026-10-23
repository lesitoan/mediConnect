"use client";

import Image from "next/image";
import { useState } from "react";
import {
  MoreHorizontal,
  Star,
  ArrowRight,
  CheckCircle2,
  PauseCircle,
  Edit2,
  Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { Doctor } from "../types/doctorTypes";

interface DoctorCardProps {
  doctor: Doctor;
  onViewDetails: (doctor: Doctor) => void;
  onEdit: (doctor: Doctor) => void;
  onDeactivate: (doctor: Doctor) => void;
  onActivate: (doctor: Doctor) => void;
}

export function DoctorCard({
  doctor,
  onViewDetails,
  onEdit,
  onDeactivate,
  onActivate,
}: DoctorCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isActive = doctor.status === "ACTIVE";

  return (
    <Card
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden transition-all duration-150 hover:shadow-md hover:border-primary/60",
        isActive ? "border-border-strong/80 bg-surface shadow-xs" : "border-border bg-surface/60 shadow-xs opacity-90"
      )}
    >
      <div
        className={cn(
          "h-1 w-full",
          isActive ? "bg-primary" : "bg-border"
        )}
      />

      <div className="flex flex-1 flex-col p-3.5">
        <div className="flex items-center justify-between">
          <Badge
            variant={isActive ? "success" : "neutral"}
            shape="pill"
            className="gap-1 px-2 py-0.5 text-label"
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                isActive ? "bg-success" : "bg-muted"
              )}
            />
            <span>{isActive ? "Đang hoạt động" : "Đã vô hiệu hóa"}</span>
          </Badge>

          <div className="relative">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-muted hover:text-foreground"
              aria-label="Thao tác"
            >
              <MoreHorizontal className="size-3.5" />
            </Button>

            {isMenuOpen && (
              <>
                <div
                  role="button"
                  tabIndex={0}
                  aria-label="Đóng bảng chọn thao tác"
                  className="fixed inset-0 z-20"
                  onClick={() => setIsMenuOpen(false)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      setIsMenuOpen(false);
                    }
                  }}
                />
                <div className="absolute top-7 right-0 z-30 w-44 rounded-app-lg border border-border bg-surface-overlay p-1 text-caption shadow-popover">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onViewDetails(doctor);
                    }}
                    className="flex w-full items-center gap-2 rounded-app-md px-2.5 py-1.5 text-left font-medium text-foreground hover:bg-item-hover"
                  >
                    <Eye className="size-3.5 text-primary" />
                    <span>Xem hồ sơ & Lịch</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onEdit(doctor);
                    }}
                    className="flex w-full items-center gap-2 rounded-app-md px-2.5 py-1.5 text-left font-medium text-foreground hover:bg-item-hover"
                  >
                    <Edit2 className="size-3.5 text-muted" />
                    <span>Chỉnh sửa thông tin</span>
                  </button>

                  <div className="my-1 h-px bg-border" />

                  {isActive ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onDeactivate(doctor);
                      }}
                      className="flex w-full items-center gap-2 rounded-app-md px-2.5 py-1.5 text-left font-medium text-danger hover:bg-danger-bg"
                    >
                      <PauseCircle className="size-3.5 text-danger" />
                      <span>Tạm dừng hoạt động</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onActivate(doctor);
                      }}
                      className="flex w-full items-center gap-2 rounded-app-md px-2.5 py-1.5 text-left font-semibold text-primary hover:bg-primary-light"
                    >
                      <CheckCircle2 className="size-3.5 text-primary" />
                      <span>Kích hoạt lại</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-2.5 flex items-center gap-2.5">
          <div
            className={cn(
              "relative size-11 shrink-0 overflow-hidden rounded-full border",
              isActive ? "border-primary/20 shadow-xs" : "border-border"
            )}
          >
            <Image
              src={doctor.avatarUrl}
              alt={doctor.name}
              fill
              sizes="44px"
              className={cn("object-cover", !isActive && "grayscale-30")}
            />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-doctor font-bold text-foreground leading-snug">
              {doctor.name}
            </h3>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-caption">
              <span className="font-bold uppercase text-muted tabular-nums">
                {doctor.code}
              </span>
              <span className="text-muted">•</span>
              <Badge
                variant={isActive ? "brand" : "neutral"}
                className="px-1.5 py-0.2 text-caption font-semibold"
              >
                {doctor.specialtyName}
              </Badge>
            </div>
          </div>
        </div>

        <div
          className={cn(
            "mt-2.5 flex items-center justify-between rounded-app-md p-2 border border-border/40",
            isActive ? "bg-primary-light/40" : "bg-background"
          )}
        >
          <div className="flex flex-col items-center">
            <span className="text-caption text-muted">Kinh nghiệm</span>
            <span
              className={cn(
                "text-heading font-bold tabular-nums",
                isActive ? "text-foreground" : "text-muted"
              )}
            >
              {doctor.experienceYears} năm
            </span>
          </div>

          <div className="h-6 w-px bg-border" />

          <div className="flex flex-col items-center">
            <span className="text-caption text-muted">
              {isActive ? "Lịch hẹn tuần" : "Lịch hẹn tồn"}
            </span>
            <span
              className={cn(
                "text-heading font-bold tabular-nums",
                isActive ? "text-primary" : "text-muted"
              )}
            >
              {doctor.weeklyAppointments} ca
            </span>
          </div>

          <div className="h-6 w-px bg-border" />

          <div className="flex items-center gap-1">
            <Star className="size-3.5 fill-rating text-rating" />
            <span
              className={cn(
                "text-heading font-bold tabular-nums",
                isActive ? "text-foreground" : "text-muted"
              )}
            >
              {doctor.rating.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="mt-2.5 flex items-center justify-between border-t border-border pt-2.5">
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={() => onViewDetails(doctor)}
            className={cn(
              "p-0 h-auto gap-1 text-body font-semibold",
              isActive ? "text-primary" : "text-muted hover:text-foreground"
            )}
          >
            <span>Xem hồ sơ & Lịch</span>
            <ArrowRight className="size-3" />
          </Button>

          {isActive ? (
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => onEdit(doctor)}
              className="text-muted hover:text-foreground text-caption"
            >
              Chỉnh sửa
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              size="xs"
              onClick={() => onActivate(doctor)}
              className="font-bold text-primary hover:bg-secondary-hover text-caption"
            >
              Kích hoạt lại
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
