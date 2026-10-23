"use client";

import Image from "next/image";
import { Star, Eye, Edit2, PauseCircle, CheckCircle2 } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Doctor } from "../types/doctorTypes";

interface DoctorTableProps {
  doctors: Doctor[];
  onViewDetails: (doctor: Doctor) => void;
  onEdit: (doctor: Doctor) => void;
  onDeactivate: (doctor: Doctor) => void;
  onActivate: (doctor: Doctor) => void;
}

export function DoctorTable({
  doctors,
  onViewDetails,
  onEdit,
  onDeactivate,
  onActivate,
}: DoctorTableProps) {
  return (
    <div className="overflow-hidden rounded-app-xl border border-border-strong bg-surface shadow-xs">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="px-3.5 py-2.5">
              Bác sĩ & Mã định danh
            </TableHead>
            <TableHead className="px-3.5 py-2.5">Chuyên khoa</TableHead>
            <TableHead className="px-3.5 py-2.5">Kinh nghiệm</TableHead>
            <TableHead className="px-3.5 py-2.5">Lịch hẹn tuần</TableHead>
            <TableHead className="px-3.5 py-2.5">Đánh giá</TableHead>
            <TableHead className="px-3.5 py-2.5">Trạng thái</TableHead>
            <TableHead className="px-3.5 py-2.5 text-right">
              Thao tác
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {doctors.map((doctor) => {
            const isActive = doctor.status === "ACTIVE";

            return (
              <TableRow key={doctor.id}>
                <TableCell className="px-3.5 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="relative size-9 shrink-0 overflow-hidden rounded-full border border-border">
                      <Image
                        src={doctor.avatarUrl}
                        alt={doctor.name}
                        fill
                        sizes="40px"
                        className={cn("object-cover", !isActive && "grayscale-30")}
                      />
                    </div>
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => onViewDetails(doctor)}
                        className="truncate text-left text-doctor font-bold text-foreground hover:text-primary hover:underline"
                      >
                        {doctor.name}
                      </button>
                      <div className="text-caption text-muted font-semibold tabular-nums">
                        {doctor.code} • {doctor.licenseNumber}
                      </div>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="px-3.5 py-2.5">
                  <Badge variant="brand" className="text-caption font-semibold">
                    {doctor.specialtyName}
                  </Badge>
                </TableCell>

                <TableCell className="px-3.5 py-2.5 text-body font-medium text-muted tabular-nums">
                  {doctor.experienceYears} năm
                </TableCell>

                <TableCell className="px-3.5 py-2.5 text-body font-bold text-primary tabular-nums">
                  {doctor.weeklyAppointments} ca
                </TableCell>

                <TableCell className="px-3.5 py-2.5">
                  <div className="flex items-center gap-1 text-body font-semibold text-foreground tabular-nums">
                    <Star className="size-3.5 fill-rating text-rating" />
                    <span>{doctor.rating.toFixed(2)}</span>
                  </div>
                </TableCell>

                <TableCell className="px-3.5 py-2.5">
                  <Badge
                    variant={isActive ? "success" : "neutral"}
                    shape="pill"
                    className="gap-1.5 text-caption"
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        isActive ? "bg-success" : "bg-muted"
                      )}
                    />
                    <span>{isActive ? "Đang hoạt động" : "Đã vô hiệu hóa"}</span>
                  </Badge>
                </TableCell>

                <TableCell className="px-3.5 py-2.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onViewDetails(doctor)}
                      className="text-primary hover:bg-primary-light"
                      title="Xem hồ sơ & Lịch"
                    >
                      <Eye className="size-4" />
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onEdit(doctor)}
                      className="text-muted hover:text-foreground hover:bg-item-hover"
                      title="Chỉnh sửa thông tin"
                    >
                      <Edit2 className="size-4" />
                    </Button>

                    {isActive ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => onDeactivate(doctor)}
                        className="text-danger hover:bg-danger-bg"
                        title="Tạm dừng hoạt động"
                      >
                        <PauseCircle className="size-4" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => onActivate(doctor)}
                        className="text-primary hover:bg-primary-light"
                        title="Kích hoạt lại"
                      >
                        <CheckCircle2 className="size-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
