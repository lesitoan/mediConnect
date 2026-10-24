"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarRange,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Save,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type {
  Doctor,
  DeactivateDoctorInput,
} from "../types/doctorTypes";

interface DeactivateDoctorModalProps {
  doctor: Doctor | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: DeactivateDoctorInput) => void;
}

const COMMON_REASONS = [
  "Nghỉ phép thường niên",
  "Công tác & Hội thảo",
  "Đào tạo & Tu nghiệp",
  "Lý do sức khỏe",
];

function getFormattedDate(offsetDays: number = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split("T")[0];
}

function formatDateVN(dateStr?: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function PauseDoctorModalContent({
  doctor,
  onClose,
  onConfirm,
}: {
  doctor: Doctor;
  onClose: () => void;
  onConfirm: (payload: DeactivateDoctorInput) => void;
}) {
  const router = useRouter();
  const today = getFormattedDate(0);
  const defaultEnd = getFormattedDate(14);

  const [startDate, setStartDate] = useState(doctor.pauseStartDate || today);
  const [endDate, setEndDate] = useState(doctor.pauseEndDate || defaultEnd);
  const [isIndefinite, setIsIndefinite] = useState(doctor.isIndefinitePause ?? false);
  const [reason, setReason] = useState(doctor.pauseReason || "");

  // Đánh giá tác động lịch hẹn trong khoảng thời gian đã chọn
  const affectedAppointments = doctor.weeklyAppointments;
  const hasAffectedAppointments = affectedAppointments > 0;

  const handleApplyPreset = (days: number | "INDEFINITE") => {
    if (days === "INDEFINITE") {
      setIsIndefinite(true);
    } else {
      setIsIndefinite(false);
      setEndDate(getFormattedDate(days));
    }
  };

  const handleSelectReason = (tag: string) => {
    if (!reason.trim()) {
      setReason(tag);
    } else if (!reason.includes(tag)) {
      setReason(`${reason}; ${tag}`);
    }
  };

  // Lưu kế hoạch tạm dừng
  const handleSavePlan = () => {
    if (!startDate) return;
    if (!isIndefinite && !endDate) return;

    onConfirm({
      doctorId: doctor.id,
      strategy: "REASSIGN",
      reason: reason.trim(),
      startDate,
      endDate: isIndefinite ? undefined : endDate,
      isIndefinite,
    });
    onClose();
  };

  // Xử lý lịch bị ảnh hưởng: lưu kế hoạch và điều hướng sang trang xử lý lịch/ngoại lệ
  const handleProceedToExceptions = () => {
    handleSavePlan();
    router.push("/exceptions");
  };

  return (
    <div className="flex flex-col max-h-[90vh] overflow-hidden">
      {/* Header: Title */}
      <DialogHeader className="shrink-0 flex-row items-center justify-between px-5 py-3.5 border-b border-border space-y-0">
        <div className="flex items-center gap-2.5">
          <CalendarRange className="size-5 text-primary shrink-0" />
          <DialogTitle className="text-title font-bold text-foreground">
            Tạm dừng hoạt động bác sĩ
          </DialogTitle>
        </div>
      </DialogHeader>

      {/* Sub-header: Thông tin bác sĩ */}
      <div className="shrink-0 flex items-center justify-between px-5 py-2.5 border-b border-border/60 bg-surface">
        <div className="text-body font-bold text-foreground">
          {doctor.name}{" "}
          <span className="font-normal text-muted tabular-nums">
            • {doctor.code}
          </span>
          <span className="font-normal text-muted">
            {" "}• Khoa {doctor.specialtyName}
          </span>
        </div>
      </div>

      {/* Scrollable Form Content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-3.5 space-y-3">
        {/* Phần 1: Thời gian tạm dừng */}
        <div className="rounded-app-xl border border-border-strong bg-secondary/30 p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              <span className="text-caption font-bold text-foreground uppercase tracking-wide">
                Thời gian tạm dừng dự kiến
              </span>
            </div>
            <span className="text-label font-bold text-destructive">* Bắt buộc</span>
          </div>

          {/* Ô chọn ngày bắt đầu & kết thúc */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-caption font-semibold text-foreground">
                Ngày bắt đầu <span className="text-destructive">*</span>
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 text-caption bg-surface"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-caption font-semibold text-foreground">
                Ngày kết thúc
              </label>
              <Input
                type="date"
                value={isIndefinite ? "" : endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                disabled={isIndefinite}
                placeholder={isIndefinite ? "Chờ mở lại" : undefined}
                className={cn(
                  "h-9 text-caption bg-surface",
                  isIndefinite && "opacity-60 cursor-not-allowed bg-secondary"
                )}
              />
            </div>
          </div>

          {/* Tùy chọn 'Chờ mở lại' và chip chọn nhanh */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/40">
            <label className="inline-flex items-center gap-2 cursor-pointer text-caption font-medium text-foreground">
              <input
                type="checkbox"
                checked={isIndefinite}
                onChange={(e) => setIsIndefinite(e.target.checked)}
                className="size-4 rounded-sm accent-primary cursor-pointer"
              />
              <span>Chờ mở lại (Tạm dừng vô thời hạn)</span>
            </label>

            {!isIndefinite && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-label text-muted">Chọn nhanh:</span>
                <button
                  type="button"
                  onClick={() => handleApplyPreset(7)}
                  className="rounded-app-sm border border-border bg-surface px-2 py-0.5 text-label font-semibold text-muted hover:border-primary hover:text-primary transition-colors cursor-pointer"
                >
                  1 tuần
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset(14)}
                  className="rounded-app-sm border border-border bg-surface px-2 py-0.5 text-label font-semibold text-muted hover:border-primary hover:text-primary transition-colors cursor-pointer"
                >
                  2 tuần
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset(30)}
                  className="rounded-app-sm border border-border bg-surface px-2 py-0.5 text-label font-semibold text-muted hover:border-primary hover:text-primary transition-colors cursor-pointer"
                >
                  1 tháng
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Phần 2: Đánh giá tác động (Impact assessment) */}
        {hasAffectedAppointments ? (
          <div className="rounded-app-xl border border-warning/40 bg-warning-bg/60 p-3 space-y-2">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="size-4.5 text-warning shrink-0 mt-0.5" />
              <div>
                <h4 className="text-caption font-bold text-warning">
                  Kế hoạch tạm dừng có lịch hẹn bị ảnh hưởng
                </h4>
                <p className="mt-0.5 text-caption text-foreground/85 leading-relaxed">
                  Phát hiện <span className="font-bold text-foreground">{affectedAppointments} ca hẹn</span> đã đặt trước trong khoảng thời gian từ{" "}
                  <span className="font-bold text-foreground">{formatDateVN(startDate)}</span> đến{" "}
                  <span className="font-bold text-foreground">
                    {isIndefinite ? "khi có lệnh mở lại" : formatDateVN(endDate)}
                  </span>. Cần xử lý hoặc điều phối các lịch hẹn này trước khi kế hoạch có hiệu lực đầy đủ.
                </p>
              </div>
            </div>

            <div className="divide-y divide-warning/20 border-t border-warning/20 pt-1.5 text-caption">
              <div className="flex items-center justify-between py-1">
                <span className="text-muted">Lịch hẹn cần xử lý / điều phối:</span>
                <span className="font-bold text-foreground">{affectedAppointments} ca hẹn</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-muted">Trạng thái kế hoạch:</span>
                <Badge variant="warning" shape="pill" className="px-2.5 py-0.5 text-label font-semibold">
                  Cần điều phối lịch
                </Badge>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-app-xl border border-success/30 bg-success-bg/60 p-3 space-y-2">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="size-4.5 text-success shrink-0 mt-0.5" />
              <div>
                <h4 className="text-caption font-bold text-success">
                  Không có lịch hẹn bị ảnh hưởng
                </h4>
                <p className="mt-0.5 text-caption text-foreground/80 leading-relaxed">
                  Bác sĩ không có ca hẹn nào đã đặt trước trong khoảng thời gian đã chọn. Bạn có thể lưu kế hoạch và áp dụng ngay.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-success/20 pt-1.5 text-caption">
              <span className="text-muted">Trạng thái kế hoạch:</span>
              <Badge variant="success" shape="pill" className="px-2.5 py-0.5 text-label font-semibold">
                Sẵn sàng áp dụng
              </Badge>
            </div>
          </div>
        )}

        {/* Phần 3: Ghi chú / Lý do tạm dừng (Ưu tiên optional) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="pause-doctor-reason"
              className="text-caption font-semibold text-foreground"
            >
              Ghi chú / Lý do tạm dừng <span className="font-normal text-muted">(Tùy chọn)</span>
            </label>
            <span className="text-label text-muted">Lưu vào nhật ký hồ sơ</span>
          </div>

          {/* Gợi ý lý do nhanh */}
          <div className="flex flex-wrap items-center gap-1.5">
            {COMMON_REASONS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => handleSelectReason(item)}
                className="rounded-app-sm border border-border bg-secondary/60 px-2 py-0.5 text-label font-medium text-muted hover:border-primary hover:text-foreground transition-colors cursor-pointer"
              >
                {item}
              </button>
            ))}
          </div>

          <Textarea
            id="pause-doctor-reason"
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ví dụ: Đi công tác, tu nghiệp chuyên môn, nghỉ phép thường niên..."
            className="bg-surface text-caption resize-none"
          />
        </div>
      </div>

      {/* Pinned Bottom Footer với CTA đúng workflow */}
      <div className="shrink-0 flex flex-col gap-1 px-5 py-3 border-t border-border bg-surface">
        <div className="flex items-center justify-between gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={onClose}
            className="px-5 font-medium"
          >
            Đóng
          </Button>

          {hasAffectedAppointments ? (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={handleSavePlan}
                className="gap-1.5 font-medium"
              >
                <Save className="size-4 text-muted" />
                <span>Lưu kế hoạch</span>
              </Button>

              <Button
                type="button"
                variant="default"
                size="default"
                onClick={handleProceedToExceptions}
                className="gap-1.5 font-medium"
              >
                <span>Xử lý lịch bị ảnh hưởng</span>
                <ArrowRight className="size-4" />
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="default"
              size="default"
              onClick={handleSavePlan}
              className="gap-1.5 font-medium"
            >
              <CalendarRange className="size-4" />
              <span>Lưu kế hoạch tạm dừng</span>
            </Button>
          )}
        </div>

        <p className="text-label text-muted">
          {hasAffectedAppointments
            ? "Bạn có thể lưu kế hoạch trước và tiếp tục điều phối các lịch hẹn liên quan."
            : "Kế hoạch tạm dừng sẽ tự động có hiệu lực theo khung thời gian đã chọn."}
        </p>
      </div>
    </div>
  );
}

export function DeactivateDoctorModal({
  doctor,
  isOpen,
  onClose,
  onConfirm,
}: DeactivateDoctorModalProps) {
  if (!doctor) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[580px] p-0 max-h-[90vh] flex flex-col overflow-hidden">
        <PauseDoctorModalContent
          key={doctor.id}
          doctor={doctor}
          onClose={onClose}
          onConfirm={onConfirm}
        />
      </DialogContent>
    </Dialog>
  );
}

export { DeactivateDoctorModal as PauseDoctorModal };

