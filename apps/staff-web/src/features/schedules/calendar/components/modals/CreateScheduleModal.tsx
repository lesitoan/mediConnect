"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useCreateScheduleMutation } from "../../services/schedulesApi";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import type {
  CreateScheduleInput,
  DoctorScheduleRow,
} from "../../types/scheduleTypes";
import { AVAILABLE_ROOMS, TIME_RANGE_MAP } from "../../constants";
import { formatScheduleDate, getScheduleDayOfWeek } from "../../utils";

interface CreateScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctors: DoctorScheduleRow[];
  dates: string[];
}

export function CreateScheduleModal({
  isOpen,
  onClose,
  doctors,
  dates,
}: CreateScheduleModalProps) {
  const [createSchedule, { isLoading: isSubmitting, reset: resetMutation }] =
    useCreateScheduleMutation();
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Omit<CreateScheduleInput, "dayOfWeek" | "timeRange">>({
    defaultValues: {
      doctorId: "",
      date: dates[0] ?? "",
      shiftType: "MORNING",
      room: "P.204",
      isDraft: true,
      note: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      resetMutation();
      reset({
        doctorId: doctors[0]?.doctorId ?? "",
        date: dates[0] ?? "",
        shiftType: "MORNING",
        room: "P.204",
        isDraft: true,
        note: "",
      });
    }
  }, [isOpen, doctors, dates, reset, resetMutation]);

  const onFormSubmit = handleSubmit(async (values) => {
    if (isSubmitting) return;
    try {
      const result = await createSchedule({
        ...values,
        dayOfWeek: getScheduleDayOfWeek(values.date),
        timeRange: TIME_RANGE_MAP[values.shiftType],
        note: values.note?.trim(),
      }).unwrap();
      toast.success(result.message);
      onClose();
    } catch {
      toast.error("Không thể thêm ca trực. Vui lòng thử lại.");
    }
  });

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !isSubmitting && onClose()}
      disablePointerDismissal={isSubmitting}
    >
      <DialogContent className="max-w-[560px]" showCloseButton={!isSubmitting}>
        <DialogHeader>
          <DialogTitle>Xếp lịch trực mới</DialogTitle>
        </DialogHeader>

        <form onSubmit={onFormSubmit} aria-busy={isSubmitting}>
          <fieldset
            disabled={isSubmitting}
            className="m-0 min-w-0 border-0 p-0"
          >
            <div className="flex flex-col gap-4 p-5 sm:p-6">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="schedule-doctor"
                  className="text-caption font-semibold text-foreground"
                >
                  Chọn bác sĩ:
                </label>
                <Controller
                  name="doctorId"
                  control={control}
                  rules={{ required: "Vui lòng chọn bác sĩ." }}
                  render={({ field }) => (
                    <Select
                      {...field}
                      id="schedule-doctor"
                      disabled={isSubmitting}
                      className="h-10 text-body bg-surface"
                    >
                      {doctors.map((d) => (
                        <option key={d.doctorId} value={d.doctorId}>
                          {d.doctorName} ({d.doctorCode} - {d.specialtyName})
                        </option>
                      ))}
                    </Select>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="schedule-day"
                    className="text-caption font-semibold text-foreground"
                  >
                    Ngày trực:
                  </label>
                  <Controller
                    name="date"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        id="schedule-day"
                        disabled={isSubmitting}
                        className="h-10 text-body bg-surface"
                      >
                        {dates.map((date) => (
                          <option key={date} value={date}>
                            {formatScheduleDate(date)}
                          </option>
                        ))}
                      </Select>
                    )}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="schedule-shift"
                    className="text-caption font-semibold text-foreground"
                  >
                    Ca trực:
                  </label>
                  <Controller
                    name="shiftType"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        id="schedule-shift"
                        disabled={isSubmitting}
                        className="h-10 text-body bg-surface"
                      >
                        <option value="MORNING">Ca sáng (07:30 – 12:00)</option>
                        <option value="AFTERNOON">
                          Ca chiều (13:00 – 17:30)
                        </option>
                        <option value="FULL_DAY">
                          Cả ngày (07:30 – 17:30)
                        </option>
                      </Select>
                    )}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="schedule-room"
                  className="text-caption font-semibold text-foreground"
                >
                  Phòng khám phân công:
                </label>
                <Controller
                  name="room"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      id="schedule-room"
                      disabled={isSubmitting}
                      className="h-10 text-body bg-surface"
                    >
                      {AVAILABLE_ROOMS.map((r) => (
                        <option key={r.id} value={r.name}>
                          {r.name} · {r.specialty}
                        </option>
                      ))}
                    </Select>
                  )}
                />
              </div>
              <div className="flex items-center gap-2.5 rounded-app-md border border-border bg-secondary/30 p-3">
                <Controller
                  name="isDraft"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="isDraftCheck"
                      checked={field.value}
                      disabled={isSubmitting}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                    />
                  )}
                />
                <label
                  htmlFor="isDraftCheck"
                  className="cursor-pointer text-caption text-foreground select-none"
                >
                  Lưu dưới dạng <strong>Lịch nháp</strong> (chưa mở cho bệnh
                  nhân đặt hẹn ngay)
                </label>
              </div>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="schedule-note"
                  className="text-caption font-semibold text-foreground"
                >
                  Ghi chú:
                </label>
                <Input
                  id="schedule-note"
                  type="text"
                  {...register("note")}
                  placeholder="Ví dụ: Trực khám bệnh theo yêu cầu"
                  className="h-10 text-body bg-surface"
                />
              </div>
            </div>

            {errors.doctorId && (
              <p role="alert" className="px-5 pb-3 text-caption text-error">
                {errors.doctorId.message}
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
              <Button type="submit" variant="default" disabled={isSubmitting}>
                <Plus className="size-4" />
                <span>{isSubmitting ? "Đang thêm..." : "Thêm ca trực"}</span>
              </Button>
            </DialogFooter>
          </fieldset>
        </form>
      </DialogContent>
    </Dialog>
  );
}
