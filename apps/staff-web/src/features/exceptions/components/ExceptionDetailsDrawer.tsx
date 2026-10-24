"use client";

import { useId, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/Drawer";
import {
  REASSIGNMENT_DESCRIPTION,
  REASSIGNMENT_SUCCESS_MESSAGE,
  REPLACEMENT_DOCTORS,
} from "../constants";
import { useProposeReplacementDoctorMutation } from "../services/exceptionsApi";
import type {
  ExceptionAppointment,
  ExceptionGroup,
} from "../types/exceptionTypes";
import {
  buildReassignmentNotification,
  formatExceptionDate,
  formatExceptionPayment,
  getExceptionErrorMessage,
  getReplacementDoctorOptions,
} from "../utils";
import { ExceptionStatusBadge } from "./ExceptionStatusBadge";
import { ReplacementDoctorPicker } from "./ReplacementDoctorPicker";

interface ExceptionDetailsDrawerProps {
  group: ExceptionGroup | null;
  appointment: ExceptionAppointment | null;
  isOpen: boolean;
  onClose: () => void;
}

interface ExceptionDetailsContentProps {
  group: ExceptionGroup;
  appointment: ExceptionAppointment;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (replacementDoctorId: string) => Promise<void>;
}

function ExceptionDetailsContent({
  group,
  appointment,
  isSubmitting,
  onClose,
  onSubmit,
}: ExceptionDetailsContentProps) {
  const previewId = useId();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const options = getReplacementDoctorOptions(
    group,
    appointment,
    REPLACEMENT_DOCTORS,
  );
  const { register, control, handleSubmit } = useForm<{
    replacementDoctorId: string;
  }>({
    defaultValues: {
      replacementDoctorId:
        appointment.proposedDoctorId ??
        options.find((doctor) => doctor.isAvailable)?.id ??
        "",
    },
  });
  const replacementDoctorId = useWatch({
    control,
    name: "replacementDoctorId",
  });
  const selectedDoctor = options.find(
    (doctor) => doctor.id === replacementDoctorId,
  );
  const canPropose = appointment.status === "PENDING";
  const canSubmit =
    canPropose && Boolean(selectedDoctor?.isAvailable) && !isSubmitting;
  const time = `${appointment.startTime}–${appointment.endTime}`;

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      aria-busy={isSubmitting}
      onSubmit={handleSubmit(({ replacementDoctorId }) =>
        onSubmit(replacementDoctorId),
      )}
    >
      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        <section aria-label="Thông tin lịch hẹn" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-bold">Thông tin lịch hẹn</h3>
            <ExceptionStatusBadge status={appointment.status} />
          </div>
          <dl className="divide-y divide-border/60 text-body">
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="shrink-0 text-muted">Bệnh nhân</dt>
              <dd className="text-right font-semibold">
                {appointment.patientName}
                <span className="mt-0.5 block text-caption font-normal text-muted">
                  {appointment.patientId} · {appointment.code}
                </span>
              </dd>
            </div>
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="shrink-0 text-muted">Bác sĩ ban đầu</dt>
              <dd className="text-right font-semibold">
                {appointment.doctorName}
                <span className="mt-0.5 block text-caption font-normal text-muted">
                  {appointment.specialtyName} · {appointment.room}
                </span>
              </dd>
            </div>
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="shrink-0 text-muted">Giờ hẹn</dt>
              <dd className="text-right font-medium">
                {time} · {formatExceptionDate(group.date)}
              </dd>
            </div>
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="shrink-0 text-muted">Lý do</dt>
              <dd className="text-right font-medium text-danger">
                {group.reason}
              </dd>
            </div>
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="shrink-0 text-muted">Thanh toán</dt>
              <dd className="text-right font-medium">
                {formatExceptionPayment(appointment)}
              </dd>
            </div>
          </dl>
        </section>
        <section
          className="border-t border-border pt-5"
          aria-label="Đề xuất điều phối"
        >
          {canPropose ? (
            <ReplacementDoctorPicker
              options={options}
              selectedDoctorId={replacementDoctorId}
              registration={register("replacementDoctorId", { required: true })}
              date={group.date}
              time={time}
              isSubmitting={isSubmitting}
            />
          ) : (
            <div className="space-y-3">
              <h3 className="text-base font-bold">Phương án điều phối</h3>
              <div className="space-y-1 rounded-app-xl border border-border bg-background p-3.5">
                <p className="text-body font-semibold">
                  {appointment.proposedDoctorName ?? "Chưa có bác sĩ thay thế"}
                </p>
                <p className="text-caption leading-relaxed text-muted">
                  {appointment.status === "AWAITING_CONFIRMATION"
                    ? "Đề xuất đang chờ bệnh nhân đồng ý. Bác sĩ và giờ hẹn ban đầu được giữ nguyên cho đến khi xác nhận và kiểm tra lại lịch trống."
                    : appointment.status === "RESOLVED"
                      ? "Phương án đổi bác sĩ đã được xác nhận và lịch hẹn đã được điều phối."
                      : "Lịch hẹn đã hoàn tất."}
                </p>
              </div>
            </div>
          )}
        </section>
        <section
          className="space-y-3 border-t border-border pt-5"
          aria-label="Xác nhận và thông báo"
        >
          <h3 className="text-base font-bold">Xác nhận & Thông báo</h3>
          <p className="text-caption leading-relaxed text-muted">
            {REASSIGNMENT_DESCRIPTION}
          </p>
          {canPropose && (
            <dl className="flex items-center justify-between gap-4 text-body">
              <dt className="text-muted">Trạng thái sau khi gửi</dt>
              <dd className="text-right font-medium">Chờ bệnh nhân xác nhận</dd>
            </dl>
          )}
          {selectedDoctor && (
            <>
              <Button
                type="button"
                variant="link"
                className="h-auto px-0 text-caption"
                aria-expanded={isPreviewOpen}
                aria-controls={previewId}
                onClick={() => setIsPreviewOpen((isOpen) => !isOpen)}
              >
                {isPreviewOpen
                  ? "Ẩn xem trước thông báo"
                  : "Xem trước thông báo"}
              </Button>
              {isPreviewOpen && (
                <div
                  id={previewId}
                  role="region"
                  aria-label="Nội dung thông báo đề xuất"
                  className="rounded-app-xl border border-primary/20 bg-primary-light p-3.5 text-caption leading-relaxed"
                >
                  {buildReassignmentNotification(
                    group,
                    appointment,
                    selectedDoctor,
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </div>
      <DrawerFooter className="flex-wrap justify-end gap-2.5">
        <Button
          type="button"
          variant="outline"
          className="h-9 px-4 text-caption"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Đóng
        </Button>
        {canPropose && (
          <Button
            type="submit"
            className="h-9 px-4 text-caption"
            disabled={!canSubmit}
          >
            {isSubmitting ? "Đang gửi đề xuất..." : "Gửi đề xuất đổi bác sĩ"}
          </Button>
        )}
      </DrawerFooter>
    </form>
  );
}

export function ExceptionDetailsDrawer({
  group,
  appointment,
  isOpen,
  onClose,
}: ExceptionDetailsDrawerProps) {
  const [proposeReplacementDoctor, { isLoading: isSubmitting }] =
    useProposeReplacementDoctorMutation();
  if (!group || !appointment) return null;

  const handleSubmit = async (replacementDoctorId: string) => {
    if (isSubmitting || appointment.status !== "PENDING") return;
    try {
      await proposeReplacementDoctor({
        appointmentId: appointment.id,
        replacementDoctorId,
      }).unwrap();
      toast.success(REASSIGNMENT_SUCCESS_MESSAGE);
      onClose();
    } catch (error) {
      toast.error(getExceptionErrorMessage(error));
    }
  };

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(isOpen) => !isOpen && !isSubmitting && onClose()}
      swipeDirection="right"
    >
      <DrawerContent className="sm:max-w-[480px] data-[swipe-axis=x]:sm:[--drawer-content-width:30rem]">
        <DrawerHeader className="flex-row items-start justify-between gap-3 bg-surface p-5">
          <div className="space-y-1">
            <DrawerTitle>Chi tiết điều phối ngoại lệ</DrawerTitle>
            <DrawerDescription>
              Lịch hẹn bị ảnh hưởng · {formatExceptionDate(group.date)}
            </DrawerDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="text-caption text-muted"
            disabled={isSubmitting}
            onClick={onClose}
          >
            Đóng
          </Button>
        </DrawerHeader>
        <ExceptionDetailsContent
          key={`${appointment.id}:${appointment.status}`}
          group={group}
          appointment={appointment}
          isSubmitting={isSubmitting}
          onClose={onClose}
          onSubmit={handleSubmit}
        />
      </DrawerContent>
    </Drawer>
  );
}
