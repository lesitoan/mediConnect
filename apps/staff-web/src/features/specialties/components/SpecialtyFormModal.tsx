"use client";
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
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/api/apiErrorMessage";
import type {
  CreateSpecialtyInput,
  SpecialtyRecord,
} from "../types/specialtyTypes";
import {
  useCreateSpecialtyMutation,
  useUpdateSpecialtyMutation,
} from "../services/specialtiesApi";

export function SpecialtyFormModal({
  specialty,
  onClose,
}: {
  specialty?: SpecialtyRecord;
  onClose: () => void;
}) {
  const [createSpecialty] = useCreateSpecialtyMutation();
  const [updateSpecialty] = useUpdateSpecialtyMutation();
  const {
    register,
    handleSubmit,
    setError,
    formState: { isSubmitting, errors },
  } = useForm<CreateSpecialtyInput>({
    defaultValues: {
      name: specialty?.name ?? "",
      code: specialty?.code ?? "",
      roomCode: specialty?.roomCode ?? "",
      description: specialty?.description ?? "",
      consultationFee: specialty?.consultationFee ?? "",
    },
  });
  const onSubmit = handleSubmit(async (values) => {
    try {
      const changes: CreateSpecialtyInput = {
        name: values.name.trim(),
        code: values.code.trim(),
        roomCode: values.roomCode.trim(),
        description: values.description?.trim() || null,
        consultationFee: values.consultationFee.trim(),
      };
      if (
        !changes.name ||
        !changes.code ||
        !changes.roomCode ||
        !/^[1-9]\d{0,11}$/.test(changes.consultationFee)
      )
        throw new Error(
          "Nhập đủ tên, mã khoa, mã phòng và phí khám nguyên đồng lớn hơn 0 (tối đa 12 chữ số).",
        );
      if (specialty)
        await updateSpecialty({ id: specialty.id, changes }).unwrap();
      else await createSpecialty(changes).unwrap();
      toast.success(
        specialty ? "Đã cập nhật chuyên khoa." : "Đã tạo chuyên khoa.",
      );
      onClose();
    } catch (error) {
      setError("root", { message: getApiErrorMessage(error) });
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
          <DialogTitle>
            {specialty ? "Chỉnh sửa chuyên khoa" : "Thêm chuyên khoa mới"}
          </DialogTitle>
          <DialogDescription>
            Thiết lập thông tin chuyên khoa, phòng và phí khám.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <fieldset
            disabled={isSubmitting}
            className="grid gap-4 p-5 sm:grid-cols-2"
          >
            <label className="space-y-1.5 text-caption font-semibold sm:col-span-2">
              Tên chuyên khoa
              <Input required maxLength={255} {...register("name")} />
            </label>
            <label className="space-y-1.5 text-caption font-semibold">
              Mã chuyên khoa
              <Input required maxLength={20} {...register("code")} />
            </label>
            <label className="space-y-1.5 text-caption font-semibold">
              Mã phòng
              <Input required maxLength={20} {...register("roomCode")} />
            </label>
            <label className="space-y-1.5 text-caption font-semibold sm:col-span-2">
              Phí khám (VND)
              <Input
                required
                inputMode="numeric"
                maxLength={12}
                pattern="[1-9][0-9]{0,11}"
                {...register("consultationFee")}
              />
            </label>
            <label className="space-y-1.5 text-caption font-semibold sm:col-span-2">
              Mô tả
              <Textarea maxLength={10000} {...register("description")} />
            </label>
          </fieldset>
          {errors.root && (
            <p role="alert" className="px-5 pb-4 text-body text-error">
              {errors.root.message}
            </p>
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
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? "Đang lưu..." : "Lưu chuyên khoa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
