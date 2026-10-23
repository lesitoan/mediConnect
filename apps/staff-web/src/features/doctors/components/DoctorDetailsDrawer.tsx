"use client";

import { useState } from "react";
import {
  X,
  User,
  Star,
  Clock,
  CalendarRange,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { Doctor } from "../types/doctorTypes";

function formatDateVN(dateStr?: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function formatDoctorCode(code?: string): string {
  if (!code) return "";
  return code.replace("-", " - ");
}

function formatRoom(room?: string): string {
  if (!room) return "Chưa cập nhật";
  return room.split(",")[0].trim();
}

function formatLicense(license?: string): string {
  if (!license) return "Chưa cập nhật";
  return license.replace(/^CCHN-/, "CCHN - ");
}

function parseScheduleDetails(summary?: string): { days: string; time: string } {
  if (!summary || summary === "Tạm ngưng phân ca") {
    return {
      days: summary || "Chưa có lịch phân ca",
      time: "Tạm thời không có lịch khám cố định",
    };
  }

  let days = summary;
  let time = "Ca sáng 07:30–12:00 • Ca chiều 13:00–17:30";

  const match = summary.match(/^(.*?)(?:\((.*?)\))?$/);
  if (match) {
    const rawDays = match[1]?.trim() || summary;
    const rawShift = match[2]?.trim();

    if (rawDays.startsWith("Thứ")) {
      const parts = rawDays
        .replace(/^Thứ\s*/, "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      days = parts.map((p) => (p.startsWith("Thứ") ? p : `Thứ ${p}`)).join(", ");
    } else {
      days = rawDays;
    }

    if (rawShift) {
      if (rawShift.includes("sáng & chiều") || rawShift.includes("Cả ngày")) {
        time = "Ca sáng 07:30–12:00 • Ca chiều 13:00–17:30";
      } else if (rawShift.includes("sáng")) {
        time = "Ca sáng 07:30–12:00";
      } else if (rawShift.includes("chiều")) {
        time = "Ca chiều 13:00–17:30";
      } else {
        time = rawShift;
      }
    }
  }

  return { days, time };
}

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
  const scheduleInfo = parseScheduleDetails(doctor.scheduleSummary);

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
          className="flex w-screen max-w-[580px] flex-col border-l border-border bg-surface text-foreground shadow-modal"
        >
          {/* Header */}
          <div className="flex items-start justify-between px-6 pt-5 pb-3.5">
            <div className="flex items-center gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
                <User className="size-6 stroke-[1.8]" />
              </div>

              <div className="min-w-0">
                <h2
                  id="doctor-drawer-title"
                  className="text-heading font-bold text-foreground tracking-tight"
                >
                  {doctor.name}
                </h2>
                <div className="mt-0.5 flex items-center gap-1.5 text-caption">
                  <span className="font-bold text-primary tabular-nums">
                    {formatDoctorCode(doctor.code)}
                  </span>
                  <span className="text-muted">•</span>
                  <span className="font-normal text-muted">{doctor.specialtyName}</span>
                </div>
                <div className="mt-1">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-label font-medium",
                      isActive
                        ? "bg-primary-light text-primary"
                        : "bg-warning-bg text-warning"
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        isActive ? "bg-primary" : "bg-warning"
                      )}
                    />
                    <span>{isActive ? "Đang hoạt động" : "Tạm dừng hoạt động"}</span>
                  </span>
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={onClose}
              className="text-muted hover:text-foreground -mr-1 -mt-1"
              aria-label="Đóng"
            >
              <X className="size-4" />
            </Button>
          </div>

          {!isActive && (
            <div className="mx-6 mb-3 rounded-app-xl border border-warning/30 bg-warning-bg/60 p-3.5 text-caption text-foreground">
              <div className="flex items-center gap-1.5 font-bold text-warning text-caption">
                <CalendarRange className="size-4 shrink-0" />
                <span>Kế hoạch tạm dừng hoạt động</span>
              </div>
              <div className="mt-1.5 space-y-1 text-label text-muted">
                <div>
                  <span className="font-semibold text-foreground">Thời gian khóa lịch:</span>{" "}
                  {doctor.pauseStartDate ? (
                    <>
                      Từ {formatDateVN(doctor.pauseStartDate)}
                      {doctor.isIndefinitePause
                        ? " (Tạm dừng vô thời hạn)"
                        : doctor.pauseEndDate
                          ? ` đến ${formatDateVN(doctor.pauseEndDate)}`
                          : ""}
                    </>
                  ) : (
                    "Tạm dừng vô thời hạn"
                  )}
                </div>
                {doctor.pauseReason && (
                  <div>
                    <span className="font-semibold text-foreground">Lý do:</span>{" "}
                    <span className="italic text-foreground">{doctor.pauseReason}</span>
                  </div>
                )}
                {doctor.pauseStrategy && (
                  <div>
                    <span className="font-semibold text-foreground">Điều phối lịch hẹn:</span>{" "}
                    {doctor.pauseStrategy === "REASSIGN"
                      ? "Tự động chuyển tiếp sang bác sĩ cùng chuyên khoa"
                      : "Hủy lịch hẹn và thông báo hoàn phí"}
                  </div>
                )}
              </div>
            </div>
          )}

          <Tabs
            defaultValue="INFO"
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as DrawerTab)}
            className="flex flex-1 min-h-0 flex-col overflow-hidden"
          >
            {/* Tab navigation */}
            <div className="border-b border-border/80 px-6">
              <TabsList className="h-auto w-full justify-start rounded-none border-0 bg-transparent p-0 gap-8 -mb-px">
                <TabsTrigger
                  value="INFO"
                  className={cn(
                    "rounded-none border-b-2 px-0 pb-2.5 pt-1.5 text-caption transition-colors cursor-pointer data-[selected]:bg-transparent data-[selected]:shadow-none",
                    activeTab === "INFO"
                      ? "border-primary text-primary font-semibold"
                      : "border-transparent text-muted hover:text-foreground font-medium"
                  )}
                >
                  Thông tin chuyên môn
                </TabsTrigger>
                <TabsTrigger
                  value="SCHEDULE"
                  className={cn(
                    "rounded-none border-b-2 px-0 pb-2.5 pt-1.5 text-caption transition-colors cursor-pointer data-[selected]:bg-transparent data-[selected]:shadow-none",
                    activeTab === "SCHEDULE"
                      ? "border-primary text-primary font-semibold"
                      : "border-transparent text-muted hover:text-foreground font-medium"
                  )}
                >
                  Lịch trực tuần
                </TabsTrigger>
                <TabsTrigger
                  value="HISTORY"
                  className={cn(
                    "rounded-none border-b-2 px-0 pb-2.5 pt-1.5 text-caption transition-colors cursor-pointer data-[selected]:bg-transparent data-[selected]:shadow-none",
                    activeTab === "HISTORY"
                      ? "border-primary text-primary font-semibold"
                      : "border-transparent text-muted hover:text-foreground font-medium"
                  )}
                >
                  Lịch sử khám
                </TabsTrigger>
                <TabsTrigger
                  value="REVIEWS"
                  className={cn(
                    "rounded-none border-b-2 px-0 pb-2.5 pt-1.5 text-caption transition-colors cursor-pointer data-[selected]:bg-transparent data-[selected]:shadow-none",
                    activeTab === "REVIEWS"
                      ? "border-primary text-primary font-semibold"
                      : "border-transparent text-muted hover:text-foreground font-medium"
                  )}
                >
                  Đánh giá
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab contents */}
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4.5 pb-6">
              <TabsContent value="INFO" className="mt-0 space-y-5">
                {/* Section 1: Thông tin chuyên môn */}
                <section>
                  <h3 className="text-body font-bold text-foreground">
                    Thông tin chuyên môn
                  </h3>
                  <div className="mt-2 divide-y divide-border/60">
                    <div className="flex items-center justify-between py-2.5 text-caption">
                      <span className="text-muted">Chuyên khoa</span>
                      <span className="font-medium text-foreground">
                        {doctor.specialtyName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2.5 text-caption">
                      <span className="text-muted">Học hàm / Học vị</span>
                      <span className="font-bold text-foreground">
                        {doctor.degree || "PGS.TS.BS"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2.5 text-caption">
                      <span className="text-muted">Số chứng chỉ</span>
                      <span className="font-bold text-foreground">
                        {formatLicense(doctor.licenseNumber)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2.5 text-caption">
                      <span className="text-muted">Kinh nghiệm</span>
                      <span className="font-medium text-foreground">
                        {doctor.experienceYears} năm
                      </span>
                    </div>
                  </div>
                </section>

                {/* Section 2: Liên hệ & Địa điểm công tác */}
                <section>
                  <h3 className="text-body font-bold text-foreground">
                    Liên hệ & Địa điểm công tác
                  </h3>
                  <div className="mt-2 divide-y divide-border/60">
                    <div className="flex items-center justify-between py-2.5 text-caption">
                      <span className="text-muted">Phòng khám</span>
                      <span className="font-medium text-foreground">
                        {formatRoom(doctor.room)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2.5 text-caption">
                      <span className="text-muted">Điện thoại</span>
                      <span className="font-medium text-foreground">
                        {doctor.phone}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2.5 text-caption">
                      <span className="text-muted">Email</span>
                      <a
                        href={`mailto:${doctor.email}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {doctor.email}
                      </a>
                    </div>
                  </div>
                </section>

                {/* Section 3: Lịch làm việc */}
                <section>
                  <h3 className="text-body font-bold text-foreground">
                    Lịch làm việc
                  </h3>
                  <div className="mt-2 rounded-app-xl bg-primary-light/40 border border-primary/10 p-3.5 space-y-1">
                    <div className="text-caption font-bold text-foreground">
                      {scheduleInfo.days}
                    </div>
                    <div className="text-caption font-medium text-primary">
                      {scheduleInfo.time}
                    </div>
                  </div>
                </section>
              </TabsContent>

              <TabsContent value="SCHEDULE" className="mt-0 space-y-3">
                <div className="rounded-app-xl border border-border bg-background p-4 text-caption">
                  <div className="font-bold text-foreground">Ca trực tuần hiện tại</div>
                  <div className="mt-3 space-y-2.5">
                    <div className="flex items-center justify-between rounded-app-lg bg-surface p-3 shadow-xs border border-border/50">
                      <div className="flex items-center gap-2">
                        <Clock className="size-3.5 text-primary" />
                        <span className="font-semibold">Thứ 2 (Sáng: 07:30 - 11:30)</span>
                      </div>
                      <Badge variant="success">14/20 BN</Badge>
                    </div>
                    <div className="flex items-center justify-between rounded-app-lg bg-surface p-3 shadow-xs border border-border/50">
                      <div className="flex items-center gap-2">
                        <Clock className="size-3.5 text-primary" />
                        <span className="font-semibold">Thứ 4 (Chiều: 13:30 - 17:00)</span>
                      </div>
                      <Badge variant="success">18/20 BN</Badge>
                    </div>
                    <div className="flex items-center justify-between rounded-app-lg bg-surface p-3 shadow-xs border border-border/50">
                      <div className="flex items-center gap-2">
                        <Clock className="size-3.5 text-primary" />
                        <span className="font-semibold">Thứ 6 (Sáng: 07:30 - 11:30)</span>
                      </div>
                      <Badge variant="warning">20/20 BN (Đầy)</Badge>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="HISTORY" className="mt-0 space-y-2 text-caption">
                <div className="rounded-app-lg border border-border p-3.5 bg-surface">
                  <div className="flex justify-between font-semibold">
                    <span>Phiên khám ngày 12/10/2026</span>
                    <span className="text-primary font-bold">24 lượt khám</span>
                  </div>
                  <div className="mt-1 text-muted">
                    Khoa Nhi & Sơ sinh • Phòng 205
                  </div>
                </div>
                <div className="rounded-app-lg border border-border p-3.5 bg-surface">
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
                <div className="rounded-app-lg border border-border p-3.5 bg-surface">
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
                <div className="rounded-app-lg border border-border p-3.5 bg-surface">
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

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2.5 border-t border-border bg-surface px-6 py-4">
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={() => {
                onClose();
                onEdit(doctor);
              }}
              className="border-border bg-surface text-foreground hover:bg-surface-hover font-medium"
            >
              Chỉnh sửa hồ sơ
            </Button>

            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={() => setActiveTab("SCHEDULE")}
              className="border-border bg-surface text-foreground hover:bg-surface-hover font-medium"
            >
              Xem lịch làm việc
            </Button>

            {isActive ? (
              <Button
                type="button"
                variant="destructive"
                size="default"
                onClick={() => {
                  onClose();
                  onDeactivate(doctor);
                }}
                className="font-medium"
              >
                Tạm dừng hoạt động
              </Button>
            ) : (
              <Button
                type="button"
                variant="default"
                size="default"
                onClick={() => {
                  onClose();
                  onActivate(doctor);
                }}
                className="font-medium"
              >
                Kích hoạt lại
              </Button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

