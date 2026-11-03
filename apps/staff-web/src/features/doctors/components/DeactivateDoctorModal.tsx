"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/button";
import { useCreateDoctorPauseMutation } from "../services/doctorsApi";
import {
  buildPauseInterval,
  formatClinicTime,
  getDoctorApiError,
  getPauseConflict,
} from "../doctorUtils";
import type { AffectedAppointment, Doctor } from "../types/doctorTypes";

export function DeactivateDoctorModal({
  doctor,
  onClose,
}: {
  doctor: Doctor;
  onClose: () => void;
}) {
  const [createPause] = useCreateDoctorPauseMutation();
  const [isIndefinite, setIsIndefinite] = useState(false);
  const [conflicts, setConflicts] = useState<AffectedAppointment[] | null>(
    null,
  );
  const {
    register,
    handleSubmit,
    setError,
    formState: { isSubmitting, errors },
  } = useForm({ defaultValues: { startsAt: "", endsAt: "", reason: "" } });
  const onSubmit = handleSubmit(async (values) => {
    setConflicts(null);
    try {
      const interval = buildPauseInterval(
        values.startsAt,
        values.endsAt,
        isIndefinite,
      );
      await createPause({
        doctorId: doctor.id,
        ...interval,
        reason: values.reason.trim() || null,
      }).unwrap();
      toast.success("Đã lưu kế hoạch tạm dừng.");
      onClose();
    } catch (error) {
      setConflicts(getPauseConflict(error));
      setError("root", { message: getDoctorApiError(error) });
    }
  });
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !isSubmitting) onClose();
      }}
    >
      <DialogContent
        className="max-h-full max-w-2xl overflow-y-auto p-0"
        showCloseButton={!isSubmitting}
      >
        <DialogHeader>
          <DialogTitle>Lập kế hoạch tạm dừng bác sĩ</DialogTitle>
          <DialogDescription>
            {doctor.user.fullName} — {doctor.doctorCode}. Thời gian theo Việt
            Nam (UTC+7). Chỉ có hiệu lực khi đến giờ bắt đầu.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <fieldset
            disabled={isSubmitting}
            className="grid gap-4 p-5 sm:grid-cols-2"
          >
            <label className="space-y-1.5 text-caption font-semibold">
              Bắt đầu
              <Input required type="datetime-local" {...register("startsAt")} />
            </label>
            <label className="space-y-1.5 text-caption font-semibold">
              Kết thúc
              <Input
                disabled={isIndefinite}
                required={!isIndefinite}
                type="datetime-local"
                {...register("endsAt")}
              />
            </label>
            <label className="flex items-center gap-2 text-body sm:col-span-2">
              <Checkbox
                checked={isIndefinite}
                onCheckedChange={setIsIndefinite}
              />
              Không xác định ngày kết thúc
            </label>
            <label className="space-y-1.5 text-caption font-semibold sm:col-span-2">
              Lý do
              <Textarea maxLength={2000} {...register("reason")} />
            </label>
          </fieldset>
          {errors.root && (
            <p role="alert" className="px-5 pb-3 text-body text-error">
              {errors.root.message}
            </p>
          )}
          {conflicts && (
            <div className="space-y-2 px-5 pb-4 text-body">
              <p className="font-semibold text-warning">
                Chưa lưu kế hoạch. Cần xử lý các lịch hẹn sau trước khi thử lại:
              </p>
              <ul className="space-y-2">
                {conflicts.map((item) => (
                  <li
                    key={item.careSessionId}
                    className="rounded-app-md border border-border p-3"
                  >
                    {item.appointmentCode} — {item.patient.fullName} (
                    {item.patient.patientCode})<br />
                    {formatClinicTime(item.startsAt)} –{" "}
                    {formatClinicTime(item.endsAt)}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={onClose}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : "Lưu kế hoạch"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
