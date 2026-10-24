import type { UseFormRegisterReturn } from "react-hook-form";
import { Badge } from "@/components/ui/Badge";
import { Empty } from "@/components/ui/Empty";
import { cn } from "@/lib/utils";
import type { ReplacementDoctorOption } from "../types/exceptionTypes";
import { formatExceptionDate } from "../utils";

interface ReplacementDoctorPickerProps {
  options: ReplacementDoctorOption[];
  selectedDoctorId: string;
  registration: UseFormRegisterReturn<"replacementDoctorId">;
  date: string;
  time: string;
  isSubmitting: boolean;
}

export function ReplacementDoctorPicker({
  options,
  selectedDoctorId,
  registration,
  date,
  time,
  isSubmitting,
}: ReplacementDoctorPickerProps) {
  return (
    <fieldset disabled={isSubmitting} className="space-y-3">
      <legend className="text-base font-bold">Chọn bác sĩ thay thế</legend>
      <p className="text-caption text-muted">
        Các bác sĩ cùng chuyên khoa theo khả năng tiếp nhận.
      </p>
      {options.length === 0 ? (
        <Empty
          className="px-3 py-6"
          description="Chưa có bác sĩ cùng chuyên khoa để thay thế."
        />
      ) : (
        options.map((doctor) => (
          <label
            key={doctor.id}
            className={cn(
              "flex items-start gap-3 rounded-app-xl border p-3 transition-colors",
              !doctor.isAvailable
                ? "cursor-not-allowed border-border bg-background/50 opacity-70"
                : selectedDoctorId === doctor.id
                  ? "cursor-pointer border-primary/50 bg-primary-light"
                  : "cursor-pointer border-border-strong bg-surface hover:bg-item-hover",
            )}
          >
            <input
              type="radio"
              {...registration}
              value={doctor.id}
              required
              disabled={!doctor.isAvailable || isSubmitting}
              className="mt-0.5 size-4 shrink-0 accent-primary"
            />
            <span className="min-w-0 flex-1 space-y-1">
              <span className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-body font-bold">{doctor.name}</span>
                {doctor.isAvailable && (
                  <Badge variant="success" shape="pill">
                    Khả dụng
                  </Badge>
                )}
              </span>
              <span className="block text-caption text-muted">
                {doctor.specialtyName} · {doctor.room}
              </span>
              <span
                className={cn(
                  "block text-caption",
                  doctor.isAvailable ? "text-muted" : "text-danger",
                )}
              >
                {doctor.isAvailable
                  ? `${time} · ${formatExceptionDate(date)}`
                  : doctor.unavailableReason}
              </span>
            </span>
          </label>
        ))
      )}
      {options.length > 0 && !options.some((doctor) => doctor.isAvailable) && (
        <p role="status" className="text-caption text-warning">
          Không có bác sĩ khả dụng trong khung giờ này. Vui lòng kiểm tra lại
          lịch làm việc.
        </p>
      )}
    </fieldset>
  );
}
