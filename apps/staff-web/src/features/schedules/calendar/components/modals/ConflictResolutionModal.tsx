"use client";

import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/Select";
import { AVAILABLE_ROOMS } from "../../constants";
import {
  useResolveScheduleConflictMutation,
  useDeleteScheduleMutation,
} from "../../services/schedulesApi";
import type {
  DoctorScheduleRow,
  ScheduleShift,
} from "../../types/scheduleTypes";

interface ConflictResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: ScheduleShift | null;
  doctors: DoctorScheduleRow[];
}

interface ConflictResolutionFormValues {
  action: "MOVE_ROOM" | "REMOVE";
  room: string;
}

export function ConflictResolutionModal({
  isOpen,
  onClose,
  shift,
  doctors,
}: ConflictResolutionModalProps) {
  const [resolveConflict, { isLoading: isResolving, reset: resetResolve }] =
    useResolveScheduleConflictMutation();
  const [deleteSchedule, { isLoading: isDeleting, reset: resetDelete }] =
    useDeleteScheduleMutation();
  const { register, control, handleSubmit, reset } =
    useForm<ConflictResolutionFormValues>({
      defaultValues: { action: "MOVE_ROOM", room: "P.303" },
    });
  const action = useWatch({ control, name: "action" });
  const isSubmitting = isResolving || isDeleting;
  const doctor = doctors.find((doctor) => doctor.doctorId === shift?.doctorId);
  const conflictingDoctor = doctors.find(
    (doctor) => doctor.doctorId === shift?.conflictDoctorId,
  );

  useEffect(() => {
    if (isOpen) {
      reset({ action: "MOVE_ROOM", room: shift?.suggestedRoom ?? "P.303" });
      resetResolve();
      resetDelete();
    }
  }, [isOpen, shift, reset, resetResolve, resetDelete]);

  const onFormSubmit = handleSubmit(async (values) => {
    if (!shift || isSubmitting) return;
    try {
      const result = await (
        values.action === "REMOVE"
          ? deleteSchedule(shift.id)
          : resolveConflict({
              doctorId: shift.doctorId,
              dayOfWeek: shift.dayOfWeek,
              shiftId: shift.id,
              targetRoom: values.room,
            })
      ).unwrap();
      toast.success(result.message);
      onClose();
    } catch {
      toast.error("Không thể xử lý xung đột. Vui lòng thử lại.");
    }
  });

  if (!shift) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !isSubmitting && onClose()}
      disablePointerDismissal={isSubmitting}
    >
      <DialogContent className="max-w-[620px]" showCloseButton={!isSubmitting}>
        <DialogHeader>
          <DialogTitle>Giải quyết xung đột phòng khám</DialogTitle>
          <DialogDescription>
            {shift.room} · {shift.date} · {shift.timeRange}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onFormSubmit} aria-busy={isSubmitting}>
          <fieldset
            disabled={isSubmitting}
            className="m-0 min-w-0 border-0 p-0"
          >
            <div className="flex flex-col gap-4 p-5 sm:p-6">
              <p className="rounded-app-md border border-warning/30 bg-warning-bg p-3 text-caption text-foreground">
                Hai bác sĩ được phân cùng phòng trong cùng khung giờ. Chọn
                phương án xử lý cho {doctor?.doctorName ?? shift.doctorId}.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {[doctor, conflictingDoctor].map((item, index) => (
                  <div
                    key={item?.doctorId ?? index}
                    className="rounded-app-md border border-border bg-surface p-4"
                  >
                    <p className="text-body font-bold text-foreground">
                      {item?.doctorName ?? shift.conflictDoctorName}
                    </p>
                    <p className="mt-1 text-caption text-muted">
                      {item?.doctorCode} · {item?.specialtyName}
                    </p>
                  </div>
                ))}
              </div>
              <label className="flex items-center gap-2 text-body text-foreground">
                <input {...register("action")} type="radio" value="MOVE_ROOM" />
                Điều chuyển sang phòng khám khác
              </label>
              {action === "MOVE_ROOM" && (
                <Controller
                  name="room"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      aria-label="Chọn phòng mới"
                      disabled={isSubmitting}
                    >
                      {AVAILABLE_ROOMS.filter(
                        (room) => room.name !== shift.room,
                      ).map((room) => (
                        <option key={room.id} value={room.name}>
                          {room.name} · {room.specialty}
                        </option>
                      ))}
                    </Select>
                  )}
                />
              )}
              <label className="flex items-center gap-2 text-body text-foreground">
                <input {...register("action")} type="radio" value="REMOVE" />
                Gỡ bỏ ca trực đang chọn
              </label>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                variant={action === "REMOVE" ? "destructive" : "default"}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Đang xử lý..."
                  : action === "REMOVE"
                    ? "Xác nhận gỡ ca"
                    : "Xác nhận điều chuyển"}
              </Button>
            </DialogFooter>
          </fieldset>
        </form>
      </DialogContent>
    </Dialog>
  );
}
