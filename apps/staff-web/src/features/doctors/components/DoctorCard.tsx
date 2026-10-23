"use client";

import { useState } from "react";
import {
  MoreHorizontal,
  Star,
  ArrowRight,
  Pencil,
  History,
  Eye,
  PauseCircle,
  CheckCircle2,
} from "lucide-react";
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
        "group relative flex flex-col justify-between rounded-2xl border bg-surface p-5 transition-all duration-150 hover:shadow-md hover:border-primary/50",
        isActive
          ? "border-border/80 shadow-xs"
          : "border-border/80 bg-surface shadow-xs opacity-95"
      )}
    >
      <div className="flex flex-1 flex-col">
        {/* Top Header: Status pill badge & 3-dots menu */}
        <div className="flex items-center justify-between">
          {isActive ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success-bg px-2.5 py-0.5 text-label font-medium text-success">
              <span className="size-1.5 rounded-full bg-success" />
              <span>Hoạt động</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-bg px-2.5 py-0.5 text-label font-medium text-muted">
              <span className="size-1.5 rounded-full bg-muted" />
              <span>Tạm dừng hoạt động</span>
            </span>
          )}

          <div className="relative">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-muted hover:text-foreground"
              aria-label="Thao tác"
            >
              <MoreHorizontal className="size-4" />
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
                <div className="absolute top-7 right-0 z-30 w-48 rounded-app-lg border border-border bg-surface p-1 text-caption shadow-popover">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onViewDetails(doctor);
                    }}
                    className="flex w-full items-center gap-2 rounded-app-md px-2.5 py-1.5 text-left font-medium text-foreground hover:bg-item-hover"
                  >
                    <Eye className="size-3.5 text-primary" />
                    <span>Xem chi tiết hồ sơ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onEdit(doctor);
                    }}
                    className="flex w-full items-center gap-2 rounded-app-md px-2.5 py-1.5 text-left font-medium text-foreground hover:bg-item-hover"
                  >
                    <Pencil className="size-3.5 text-muted" />
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
                      className="flex w-full items-center gap-2 rounded-app-md px-2.5 py-1.5 text-left font-medium text-destructive hover:bg-danger-bg"
                    >
                      <PauseCircle className="size-3.5 text-destructive" />
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

        {/* Doctor Name & Subtitle (No photo avatar per Image 1) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onViewDetails(doctor)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              onViewDetails(doctor);
            }
          }}
          className="mt-3.5 cursor-pointer text-left focus:outline-hidden"
        >
          <h3 className="text-heading font-bold text-foreground leading-snug tracking-tight hover:text-primary transition-colors">
            {doctor.name}
          </h3>
          <div className="mt-1 text-caption text-muted">
            <span>{doctor.code}</span>
            <span> • </span>
            <span>{doctor.specialtyName}</span>
          </div>
        </div>

        {/* Metrics Row: 3 columns (Kinh nghiệm, Lịch tuần, Rating) */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="flex flex-col">
            <span className="text-caption text-muted">Kinh nghiệm</span>
            <span className="mt-1 text-base font-bold text-foreground tabular-nums">
              {doctor.experienceYears} năm
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-caption text-muted">Lịch tuần</span>
            <span
              className={cn(
                "mt-1 text-base font-bold tabular-nums",
                isActive ? "text-primary" : "text-muted"
              )}
            >
              {isActive ? `${doctor.weeklyAppointments} ca` : "0 ca"}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-caption text-muted">Đánh giá</span>
            <span
              className={cn(
                "mt-1 text-base font-bold tabular-nums flex items-center gap-1",
                isActive ? "text-primary" : "text-muted"
              )}
            >
              {isActive ? (
                <>
                  <Star className="size-4 fill-rating text-rating" />
                  <span className="text-base font-bold text-foreground tabular-nums">
                    {doctor.rating.toFixed(2)}
                  </span>
                </>
              ) : (
                <>
                  <Star className="size-4 text-muted" />
                  <span className="text-base font-bold text-muted tabular-nums">
                    {doctor.rating.toFixed(2)}
                  </span>
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Footer / Actions */}
      <div className="border-t border-border/70 pt-3.5 mt-5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onViewDetails(doctor)}
          className="inline-flex items-center gap-1.5 text-caption font-semibold text-primary hover:underline cursor-pointer"
        >
          <span>Xem hồ sơ</span>
          <ArrowRight className="size-3.5" />
        </button>

        {isActive ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => onEdit(doctor)}
            className="text-muted hover:text-foreground"
            aria-label="Chỉnh sửa hồ sơ"
            title="Chỉnh sửa hồ sơ"
          >
            <Pencil className="size-4" />
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => onActivate(doctor)}
            className="text-primary hover:text-primary-hover"
            aria-label="Khôi phục hoạt động"
            title="Khôi phục hoạt động"
          >
            <History className="size-4" />
          </Button>
        )}
      </div>
    </Card>
  );
}
