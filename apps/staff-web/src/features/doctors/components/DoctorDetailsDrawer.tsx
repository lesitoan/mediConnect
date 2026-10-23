"use client";

import { useState } from "react";
import Image from "next/image";
import {
  X,
  Star,
  ShieldCheck,
  MapPin,
  Calendar,
  Clock,
  Phone,
  Mail,
  Check,
  Edit2,
  PauseCircle,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { cn } from "@/lib/utils";
import type { Doctor } from "../types/doctorTypes";

interface DoctorDetailsDrawerProps {
  doctor: Doctor | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (doctor: Doctor) => void;
  onDeactivate: (doctor: Doctor) => void;
  onActivate: (doctor: Doctor) => void;
}

type DrawerTab = "INFO" | "SCHEDULE" | "HISTORY" | "REVIEWS";

export function DoctorDetailsDrawer({
  doctor,
  isOpen,
  onClose,
  onEdit,
  onDeactivate,
  onActivate,
}: DoctorDetailsDrawerProps) {
  const [activeTab, setActiveTab] = useState<DrawerTab>("INFO");

  if (!isOpen || !doctor) return null;

  const isActive = doctor.status === "ACTIVE";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="doctor-drawer-title"
      className="fixed inset-0 z-50 overflow-hidden"
    >
      <div
        role="button"
        tabIndex={0}
        aria-label="Đóng bảng chi tiết bác sĩ"
        className="fixed inset-0 bg-brand-neutral/40 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            onClose();
          }
        }}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-6">
        <aside
          aria-label="Chi tiết thông tin bác sĩ"
          className="flex w-screen max-w-[460px] flex-col border-l border-border bg-surface-overlay text-foreground shadow-modal"
        >
          <div className="flex items-start justify-between border-b border-border bg-primary-light/50 p-4 sm:p-5">
            <div className="flex gap-3">
              <div className="relative size-13 shrink-0 overflow-hidden rounded-app-xl border border-primary/20 shadow-xs">
                <Image
                  src={doctor.avatarUrl}
                  alt={doctor.name}
                  fill
                  sizes="52px"
                  className={cn("object-cover", !isActive && "grayscale-30")}
                />
                <div className="absolute right-0.5 bottom-0.5 flex size-4.5 items-center justify-center rounded-full bg-primary text-primary-foreground ring-1 ring-surface">
                  <Check className="size-2.5 stroke-[3]" />
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
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
                  <span className="text-caption font-bold text-muted tabular-nums">
                    {doctor.code}
                  </span>
                </div>

                <h2
                  id="doctor-drawer-title"
                  className="mt-0.5 text-title font-bold text-foreground tracking-tight"
                >
                  {doctor.name}
                </h2>
                <p className="text-body font-semibold text-primary">
                  {doctor.title}
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={onClose}
              className="text-muted hover:text-foreground"
              aria-label="Đóng"
            >
              <X className="size-4" />
            </Button>
          </div>

          <div className="grid grid-cols-4 border-b border-border bg-secondary/40 px-4 py-2 text-center">
            <div>
              <div className="text-caption text-muted">Kinh nghiệm</div>
              <div className="text-heading font-bold text-foreground tabular-nums">
                {doctor.experienceYears} năm
              </div>
            </div>

            <div className="border-l border-border">
              <div className="text-caption text-muted">Đánh giá</div>
              <div className="flex items-center justify-center gap-1 text-heading font-bold text-foreground tabular-nums">
                <Star className="size-3.5 fill-rating text-rating" />
                <span>{doctor.rating.toFixed(2)}</span>
                <span className="text-caption font-normal text-muted tabular-nums">
                  ({doctor.reviewCount})
                </span>
              </div>
            </div>

            <div className="border-l border-border">
              <div className="text-caption text-muted">Ca khám tuần</div>
              <div className="text-heading font-bold text-primary tabular-nums">
                {doctor.weeklyAppointments} ca
              </div>
            </div>

            <div className="border-l border-border">
              <div className="text-caption text-muted">Khiếu nại</div>
              <div className="text-heading font-bold text-foreground tabular-nums">0 ca</div>
            </div>
          </div>

          <Tabs
            defaultValue="INFO"
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as DrawerTab)}
            className="flex flex-1 flex-col overflow-hidden"
          >
            <div className="border-b border-border px-4">
              <TabsList className="h-auto w-full justify-start rounded-none border-0 bg-transparent p-0 gap-1">
                <TabsTrigger
                  value="INFO"
                  className="rounded-none border-b-2 border-transparent px-3 py-2.5 text-caption font-bold data-[selected]:border-primary data-[selected]:bg-transparent data-[selected]:text-primary data-[selected]:shadow-none"
                >
                  Thông tin chuyên môn
                </TabsTrigger>
                <TabsTrigger
                  value="SCHEDULE"
                  className="rounded-none border-b-2 border-transparent px-3 py-2.5 text-caption font-bold data-[selected]:border-primary data-[selected]:bg-transparent data-[selected]:text-primary data-[selected]:shadow-none"
                >
                  Lịch trực tuần
                </TabsTrigger>
                <TabsTrigger
                  value="HISTORY"
                  className="rounded-none border-b-2 border-transparent px-3 py-2.5 text-caption font-bold data-[selected]:border-primary data-[selected]:bg-transparent data-[selected]:text-primary data-[selected]:shadow-none"
                >
                  Lịch sử khám
                </TabsTrigger>
                <TabsTrigger
                  value="REVIEWS"
                  className="rounded-none border-b-2 border-transparent px-3 py-2.5 text-caption font-bold data-[selected]:border-primary data-[selected]:bg-transparent data-[selected]:text-primary data-[selected]:shadow-none"
                >
                  Đánh giá BN
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              <TabsContent value="INFO" className="mt-0 space-y-3">
                <div className="space-y-2.5 rounded-app-xl border border-border bg-primary-light/30 p-4">
                  <div className="flex items-center gap-2 text-body font-semibold text-primary">
                    <ShieldCheck className="size-4" />
                    <span>Chứng chỉ & Pháp lý</span>
                  </div>
                  <div className="space-y-1.5 text-caption">
                    <div className="flex items-center justify-between">
                      <span className="text-muted">Số CCHN:</span>
                      <span className="font-bold text-foreground">
                        {doctor.licenseNumber}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted">Cơ quan cấp:</span>
                      <span className="font-semibold text-foreground">
                        {doctor.licenseIssuer}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted">Thời hạn hiệu lực:</span>
                      <Badge variant="brand" className="font-semibold">
                        {doctor.licenseExpiry}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 rounded-app-xl border border-border bg-surface p-4">
                  <div className="flex items-center gap-2 text-body font-semibold text-foreground">
                    <MapPin className="size-4 text-primary" />
                    <span>Địa điểm & Liên hệ công tác</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 text-caption sm:grid-cols-2">
                    <div className="rounded-app-lg bg-background p-2.5 border border-border/40">
                      <div className="text-muted">Phòng khám cố định</div>
                      <div className="mt-0.5 font-semibold text-foreground">
                        {doctor.room}
                      </div>
                    </div>
                    <div className="rounded-app-lg bg-background p-2.5 border border-border/40">
                      <div className="flex items-center gap-1 text-muted">
                        <Phone className="size-3" />
                        <span>Điện thoại nội bộ / Di động</span>
                      </div>
                      <div className="mt-0.5 font-semibold text-foreground">
                        {doctor.phone}
                      </div>
                    </div>
                    <div className="col-span-1 rounded-app-lg bg-background p-2.5 border border-border/40 sm:col-span-2">
                      <div className="flex items-center gap-1 text-muted">
                        <Mail className="size-3" />
                        <span>Email công vụ</span>
                      </div>
                      <div className="mt-0.5 font-semibold text-primary">
                        {doctor.email}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 rounded-app-xl border border-border bg-surface p-4">
                  <div className="flex items-center gap-2 text-body font-semibold text-foreground">
                    <Calendar className="size-4 text-primary" />
                    <span>Lịch khám & Giới hạn tiếp nhận</span>
                  </div>
                  <div className="space-y-2 text-caption">
                    <div className="flex items-center justify-between rounded-app-lg bg-background p-2.5 border border-border/40">
                      <span className="text-muted">Lịch phân ca cố định:</span>
                      <span className="font-semibold text-foreground">
                        {doctor.scheduleSummary}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-app-lg bg-background p-2.5 border border-border/40">
                      <span className="text-muted">Giới hạn BN / phiên khám:</span>
                      <span className="font-bold text-primary">
                        {doctor.patientLimitPerSession} bệnh nhân / ca
                      </span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="SCHEDULE" className="mt-0 space-y-3">
                <div className="rounded-app-xl border border-border bg-background p-4 text-caption">
                  <div className="font-bold text-foreground">Ca trực tuần hiện tại</div>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between rounded-app-lg bg-surface p-2.5 shadow-xs border border-border/50">
                      <div className="flex items-center gap-2">
                        <Clock className="size-3.5 text-primary" />
                        <span className="font-semibold">Thứ 2 (Sáng: 07:30 - 11:30)</span>
                      </div>
                      <Badge variant="success">
                        14/20 BN
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between rounded-app-lg bg-surface p-2.5 shadow-xs border border-border/50">
                      <div className="flex items-center gap-2">
                        <Clock className="size-3.5 text-primary" />
                        <span className="font-semibold">Thứ 4 (Chiều: 13:30 - 17:00)</span>
                      </div>
                      <Badge variant="success">
                        18/20 BN
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between rounded-app-lg bg-surface p-2.5 shadow-xs border border-border/50">
                      <div className="flex items-center gap-2">
                        <Clock className="size-3.5 text-primary" />
                        <span className="font-semibold">Thứ 6 (Sáng: 07:30 - 11:30)</span>
                      </div>
                      <Badge variant="warning">
                        20/20 BN (Đầy)
                      </Badge>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="HISTORY" className="mt-0 space-y-2 text-caption">
                <div className="rounded-app-lg border border-border p-3 bg-surface">
                  <div className="flex justify-between font-semibold">
                    <span>Phiên khám ngày 12/10/2026</span>
                    <span className="text-primary font-bold">24 lượt khám</span>
                  </div>
                  <div className="mt-1 text-muted">
                    Khoa Nhi & Sơ sinh • Phòng 205
                  </div>
                </div>
                <div className="rounded-app-lg border border-border p-3 bg-surface">
                  <div className="flex justify-between font-semibold">
                    <span>Phiên khám ngày 10/10/2026</span>
                    <span className="text-primary font-bold">22 lượt khám</span>
                  </div>
                  <div className="mt-1 text-muted">
                    Khoa Nhi & Sơ sinh • Phòng 205
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="REVIEWS" className="mt-0 space-y-3 text-caption">
                <div className="rounded-app-lg border border-border p-3 bg-surface">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Nguyễn Hoàng A. (Bệnh nhân)</span>
                    <div className="flex items-center gap-0.5 text-rating font-bold">
                      <Star className="size-3 fill-rating" />
                      <span>5.0</span>
                    </div>
                  </div>
                  <p className="mt-1 text-muted">
                    Bác sĩ rất ân cần, giải thích cặn kẽ bệnh án và đưa ra phác đồ điều trị phù hợp cho bé.
                  </p>
                </div>
                <div className="rounded-app-lg border border-border p-3 bg-surface">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Trần Thị B. (Bệnh nhân)</span>
                    <div className="flex items-center gap-0.5 text-rating font-bold">
                      <Star className="size-3 fill-rating" />
                      <span>5.0</span>
                    </div>
                  </div>
                  <p className="mt-1 text-muted">
                    Phòng khám sạch sẽ, bác sĩ khám đúng giờ và rất tận tâm.
                  </p>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          <div className="flex items-center justify-between border-t border-border bg-surface px-4 py-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Đóng
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onEdit(doctor);
                }}
                className="gap-1.5 font-semibold text-foreground"
              >
                <Edit2 className="size-3.5 text-muted" />
                <span>Chỉnh sửa hồ sơ</span>
              </Button>

              {isActive ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onDeactivate(doctor);
                  }}
                  className="gap-1.5"
                >
                  <PauseCircle className="size-3.5" />
                  <span>Tạm dừng</span>
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onActivate(doctor);
                  }}
                  className="gap-1.5 font-semibold"
                >
                  <CheckCircle2 className="size-3.5" />
                  <span>Kích hoạt lại</span>
                </Button>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
