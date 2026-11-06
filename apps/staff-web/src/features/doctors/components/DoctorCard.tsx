"use client";
import { useState } from "react";
import { MoreHorizontal, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover";
import { formatDoctorName } from "../doctorUtils";
import type { Doctor } from "../types/doctorTypes";

export function DoctorCard({
  doctor,
  onViewDetails,
  onEdit,
  onDeactivate,
}: {
  doctor: Doctor;
  onViewDetails: (doctor: Doctor) => void;
  onEdit: (doctor: Doctor) => void;
  onDeactivate: (doctor: Doctor) => void;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const runAction = (action: (doctor: Doctor) => void) => {
    setIsMenuOpen(false);
    action(doctor);
  };
  return (
    <Card className="flex h-full flex-col rounded-app-2xl border-border-strong bg-surface p-5">
      <div className="flex items-center justify-between gap-2">
        <Badge
          shape="pill"
          variant={doctor.isActive ? "success" : "neutral"}
          className="border-0 font-medium"
        >
          <span
            aria-hidden="true"
            className={
              doctor.isActive
                ? "size-2 rounded-full bg-success"
                : "size-2 rounded-full bg-muted"
            }
          />
          {doctor.isPaused
            ? "Đang tạm dừng"
            : doctor.isActive
              ? "Hoạt động"
              : "Ngừng hoạt động"}
        </Badge>
        <Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <PopoverTrigger
            render={
              <Button
                variant="ghost"
                size="icon-xs"
                className="text-muted"
                aria-label={"Thao tác với " + doctor.user.fullName}
              />
            }
          >
            <MoreHorizontal className="size-4" />
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="min-w-48 p-1.5"
            aria-label="Thao tác bác sĩ"
          >
            <div className="flex flex-col items-stretch">
              <Button
                variant="ghost"
                className="justify-start"
                onClick={() => runAction(onViewDetails)}
              >
                Xem chi tiết hồ sơ
              </Button>
              <Button
                variant="ghost"
                className="justify-start"
                onClick={() => runAction(onEdit)}
              >
                Chỉnh sửa thông tin
              </Button>
              <Button
                variant="ghost"
                className="justify-start"
                onClick={() => runAction(onDeactivate)}
              >
                Lập kế hoạch tạm dừng
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <div className="mt-4 min-w-0 border-b border-border pb-3">
        <h2>
          <Button
            variant="link"
            onClick={() => onViewDetails(doctor)}
            className="h-auto w-full justify-start whitespace-normal p-0 text-left text-title font-bold leading-snug text-foreground hover:text-primary"
          >
            {formatDoctorName(doctor)}
          </Button>
        </h2>
        <p className="mt-1 break-words text-body text-muted">
          {doctor.doctorCode} · {doctor.specialty.name}
        </p>
      </div>
      <dl className="grid grid-cols-3 items-center gap-2 py-4">
        <div>
          <dt className="text-body text-muted">Kinh nghiệm</dt>
          <dd
            className="mt-1 text-heading font-bold"
            aria-label="Kinh nghiệm chưa cập nhật"
          >
            —
          </dd>
        </div>
        <div>
          <dt className="text-body text-muted">Lịch tuần</dt>
          <dd
            className="mt-1 text-heading font-bold text-primary"
            aria-label="Số ca tuần chưa cập nhật"
          >
            —
          </dd>
        </div>
        <div
          className="flex items-center justify-end gap-1"
          aria-label="Đánh giá chưa cập nhật"
        >
          <dt className="sr-only">Đánh giá từ bệnh nhân</dt>
          <Star aria-hidden="true" className="size-4 fill-rating text-rating" />
          <dd className="text-heading font-bold">—</dd>
        </div>
      </dl>
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
        <Button
          variant="link"
          size="sm"
          className="h-auto p-0 font-semibold"
          onClick={() => onViewDetails(doctor)}
        >
          Xem hồ sơ
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted"
          onClick={() => onEdit(doctor)}
        >
          Chỉnh sửa
        </Button>
      </div>
    </Card>
  );
}
