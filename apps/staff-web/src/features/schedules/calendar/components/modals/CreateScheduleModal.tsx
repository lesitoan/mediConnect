"use client";

import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useCreateScheduleMutation } from "../../services/schedulesApi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { AdminDoctor, CreateScheduleInput } from "../../types/scheduleTypes";
import { getVietnamDate } from "@/lib/dateUtils";

interface CreateScheduleFormValues
  extends Omit<CreateScheduleInput, "startsAt" | "endsAt" | "effectiveTo"> {
  startsAt: string;
  endsAt: string;
  effectiveTo: string;
}

interface CreateScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctors: AdminDoctor[];
  dates: string[];
}

const WEEKDAYS = [
  { value: 1, label: "Thứ Hai" },
  { value: 2, label: "Thứ Ba" },
  { value: 3, label: "Thứ Tư" },
  { value: 4, label: "Thứ Năm" },
  { value: 5, label: "Thứ Sáu" },
  { value: 6, label: "Thứ Bảy" },
  { value: 7, label: "Chủ nhật" },
];

export function CreateScheduleModal({
  isOpen,
  onClose,
  doctors,
  dates,
}: CreateScheduleModalProps) {
  const activeDoctors = useMemo(
    () => doctors.filter((doctor) => doctor.isActive),
    [doctors],
  );
  const [createSchedule, { isLoading: isSubmitting, reset: resetMutation }] =
    useCreateScheduleMutation();
  const {
    control,
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm<CreateScheduleFormValues>({
    defaultValues: {
      staffUserId: "",
      staffType: "DOCTOR",
      dayOfWeek: 1,
      startsAt: "07:30",
      endsAt: "12:00",
      effectiveFrom: getVietnamDate(),
      effectiveTo: "",
      scheduleType: "REGULAR",
      slotDurationMinutes: 30,
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    resetMutation();
    reset({
      staffUserId: activeDoctors[0]?.userId ?? "",
      staffType: "DOCTOR",
      dayOfWeek: 1,
      startsAt: "07:30",
      endsAt: "12:00",
      effectiveFrom: dates[0] ?? getVietnamDate(),
      effectiveTo: "",
      scheduleType: "REGULAR",
      slotDurationMinutes: 30,
    });
  }, [activeDoctors, dates, isOpen, reset, resetMutation]);

  const onFormSubmit = handleSubmit(async (values) => {
    if (isSubmitting) return;
    try {
      await createSchedule({
        staffUserId: values.staffUserId,
        staffType: "DOCTOR",
        dayOfWeek: values.dayOfWeek,
        startsAt: `${values.effectiveFrom}T${values.startsAt}:00+07:00`,
        endsAt: `${values.effectiveFrom}T${values.endsAt}:00+07:00`,
        effectiveFrom: values.effectiveFrom,
        ...(values.effectiveTo ? { effectiveTo: values.effectiveTo } : {}),
        scheduleType: values.scheduleType,
        slotDurationMinutes: values.slotDurationMinutes,
      }).unwrap();
      toast.success("Đã tạo lịch lặp theo tuần.");
      onClose();
    } catch {
      toast.error("Không thể tạo lịch. Vui lòng kiểm tra dữ liệu và thử lại.");
    }
  });

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !isSubmitting && onClose()}
      disablePointerDismissal={isSubmitting}
    >
      <DialogContent className="max-w-[620px]" showCloseButton={!isSubmitting}>
        <DialogHeader>
          <DialogTitle>Tạo lịch làm việc lặp theo tuần</DialogTitle>
          <DialogDescription>
            Lịch sẽ áp dụng vào ngày trong tuần đã chọn cho đến ngày kết thúc,
            hoặc không giới hạn nếu để trống ngày kết thúc. Khi công bố, hệ
            thống tạo lượt khám tối đa 90 ngày tiếp theo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onFormSubmit} aria-busy={isSubmitting}>
          <fieldset
            disabled={isSubmitting || activeDoctors.length === 0}
            className="m-0 min-w-0 border-0 p-0"
          >
            <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label
                  htmlFor="schedule-doctor"
                  className="text-caption font-semibold text-foreground"
                >
                  Bác sĩ
                </label>
                <Controller
                  name="staffUserId"
                  control={control}
                  rules={{ required: "Vui lòng chọn bác sĩ." }}
                  render={({ field }) => (
                    <Select
                      {...field}
                      id="schedule-doctor"
                      className="h-10 bg-surface text-body"
                    >
                      {activeDoctors.map((doctor) => (
                        <option key={doctor.userId} value={doctor.userId}>
                          {doctor.user.fullName} ({doctor.doctorCode} -{" "}
                          {doctor.specialty.name})
                        </option>
                      ))}
                    </Select>
                  )}
                />
                {errors.staffUserId && (
                  <p role="alert" className="text-caption text-error">
                    {errors.staffUserId.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="schedule-day"
                  className="text-caption font-semibold text-foreground"
                >
                  Ngày trong tuần
                </label>
                <Controller
                  name="dayOfWeek"
                  control={control}
                  render={({ field }) => (
                    <Select
                      id="schedule-day"
                      value={field.value}
                      onChange={(event) =>
                        field.onChange(Number(event.target.value))
                      }
                      className="h-10 bg-surface text-body"
                    >
                      {WEEKDAYS.map((day) => (
                        <option key={day.value} value={day.value}>
                          {day.label}
                        </option>
                      ))}
                    </Select>
                  )}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="schedule-type"
                  className="text-caption font-semibold text-foreground"
                >
                  Loại lịch
                </label>
                <Controller
                  name="scheduleType"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      id="schedule-type"
                      className="h-10 bg-surface text-body"
                    >
                      <option value="REGULAR">Lịch thường</option>
                      <option value="SHIFT">Lịch theo ca</option>
                    </Select>
                  )}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="schedule-start"
                  className="text-caption font-semibold text-foreground"
                >
                  Giờ bắt đầu
                </label>
                <Input
                  id="schedule-start"
                  type="time"
                  {...register("startsAt", { required: true })}
                  className="h-10 bg-surface text-body"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="schedule-end"
                  className="text-caption font-semibold text-foreground"
                >
                  Giờ kết thúc
                </label>
                <Input
                  id="schedule-end"
                  type="time"
                  {...register("endsAt", {
                    required: true,
                    validate: (value) =>
                      value > getValues("startsAt") ||
                      "Giờ kết thúc phải sau giờ bắt đầu.",
                  })}
                  className="h-10 bg-surface text-body"
                />
                {errors.endsAt && (
                  <p role="alert" className="text-caption text-error">
                    {errors.endsAt.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="schedule-slot-duration"
                  className="text-caption font-semibold text-foreground"
                >
                  Thời lượng mỗi lượt khám (phút)
                </label>
                <Input
                  id="schedule-slot-duration"
                  type="number"
                  min={1}
                  max={240}
                  {...register("slotDurationMinutes", {
                    valueAsNumber: true,
                    required: true,
                    min: 1,
                    max: 240,
                  })}
                  className="h-10 bg-surface text-body"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="schedule-effective-from"
                  className="text-caption font-semibold text-foreground"
                >
                  Ngày bắt đầu áp dụng
                </label>
                <Input
                  id="schedule-effective-from"
                  type="date"
                  {...register("effectiveFrom", { required: true })}
                  className="h-10 bg-surface text-body"
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label
                  htmlFor="schedule-effective-to"
                  className="text-caption font-semibold text-foreground"
                >
                  Ngày kết thúc áp dụng
                </label>
                <Input
                  id="schedule-effective-to"
                  type="date"
                  {...register("effectiveTo", {
                    validate: (value) =>
                      !value ||
                      value >= getValues("effectiveFrom") ||
                      "Ngày kết thúc không được trước ngày bắt đầu.",
                  })}
                  className="h-10 bg-surface text-body"
                />
                <span className="text-label text-muted">
                  Để trống nếu lịch không có ngày kết thúc.
                </span>
                {errors.effectiveTo && (
                  <p role="alert" className="text-caption text-error">
                    {errors.effectiveTo.message}
                  </p>
                )}
              </div>
            </div>

            {activeDoctors.length === 0 && (
              <p className="px-5 pb-4 text-caption text-muted sm:px-6">
                Không có bác sĩ đang hoạt động để tạo lịch.
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                variant="default"
                disabled={isSubmitting || activeDoctors.length === 0}
              >
                {isSubmitting ? "Đang lưu..." : "Tạo lịch lặp"}
              </Button>
            </DialogFooter>
          </fieldset>
        </form>
      </DialogContent>
    </Dialog>
  );
}
