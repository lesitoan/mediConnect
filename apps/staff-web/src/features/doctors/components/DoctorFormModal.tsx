"use client";

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
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/button";
import type { SpecialtyRecord } from "@/features/specialties/types/specialtyTypes";
import {
  useCreateDoctorMutation,
  useUpdateDoctorMutation,
} from "../services/doctorsApi";
import { useDoctorAvatar } from "../hooks/useDoctorAvatar";
import {
  doctorChanges,
  getDoctorApiError,
  normalizeDoctorPhone,
} from "../doctorUtils";
import type {
  AcademicTitle,
  Doctor,
  DoctorWriteInput,
} from "../types/doctorTypes";
import { DoctorAvatarInput } from "./DoctorAvatarInput";

type FormValues = {
  fullName: string;
  phone: string;
  doctorCode: string;
  licenseNumber: string;
  specialtyId: string;
  academicTitle: AcademicTitle | "";
  qualification: string;
  bio: string;
};

export function DoctorFormModal({
  doctor,
  specialties,
  onClose,
}: {
  doctor?: Doctor;
  specialties: SpecialtyRecord[];
  onClose: () => void;
}) {
  const [createDoctor] = useCreateDoctorMutation();
  const [updateDoctor] = useUpdateDoctorMutation();
  const avatar = useDoctorAvatar(doctor?.avatarUrl ?? "");
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { isSubmitting, errors },
  } = useForm<FormValues>({
    defaultValues: {
      fullName: doctor?.user.fullName ?? "",
      phone: doctor?.user.phone ?? "",
      doctorCode: doctor?.doctorCode ?? "",
      licenseNumber: doctor?.licenseNumber ?? "",
      specialtyId: doctor?.specialtyId ?? "",
      academicTitle: doctor?.academicTitle ?? "",
      qualification: doctor?.qualification ?? "",
      bio: doctor?.bio ?? "",
    },
  });
  const selectedSpecialtyId = useWatch({ control, name: "specialtyId" });
  const onSubmit = handleSubmit(async (values) => {
    if (avatar.error) return;
    try {
      const fullName = doctor?.user.fullName ?? values.fullName.trim();
      const phone = doctor?.user.phone ?? normalizeDoctorPhone(values.phone);
      if (
        !doctor &&
        (!fullName ||
          /\p{Cc}/u.test(fullName) ||
          Array.from(fullName).length > 100 ||
          !/^\+84[35789]\d{8}$/.test(phone))
      )
        throw new Error("Nhập họ tên hợp lệ và số di động Việt Nam.");
      if (
        !/^[a-zA-Z0-9]+(?:[._-][a-zA-Z0-9]+)*$/.test(
          values.doctorCode.trim(),
        ) ||
        !values.licenseNumber.trim()
      )
        throw new Error("Kiểm tra mã bác sĩ và số chứng chỉ hành nghề.");
      const changes: DoctorWriteInput = {
        doctorCode: values.doctorCode.trim(),
        licenseNumber: values.licenseNumber.trim(),
        specialtyId: values.specialtyId,
        academicTitle: values.academicTitle || null,
        qualification: values.qualification.trim() || null,
        bio: values.bio.trim() || null,
        avatarUrl: await avatar.save(),
      };
      if (doctor) {
        const changed = doctorChanges(doctor, changes);
        if (!Object.keys(changed).length) {
          onClose();
          return;
        }
        await updateDoctor({ id: doctor.id, changes: changed }).unwrap();
      } else await createDoctor({ ...changes, fullName, phone }).unwrap();
      toast.success(
        doctor
          ? "Đã cập nhật hồ sơ bác sĩ."
          : "Đã tạo hồ sơ và tài khoản bác sĩ.",
      );
      onClose();
    } catch (error) {
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
        className="max-h-full max-w-3xl overflow-y-auto p-0"
        showCloseButton={!isSubmitting}
      >
        <DialogHeader>
          <DialogTitle>
            {doctor ? "Chỉnh sửa hồ sơ bác sĩ" : "Thêm bác sĩ mới"}
          </DialogTitle>
          <DialogDescription>
            {doctor
              ? "Tên, email và số điện thoại được quản lý ở tài khoản người dùng."
              : "Hệ thống tạo tài khoản bác sĩ cùng hồ sơ. Hệ thống tự cấp email."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <fieldset
            disabled={isSubmitting}
            className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2"
          >
            <label className="space-y-1.5 text-caption font-semibold">
              Họ và tên
              <Input
                aria-label="Họ và tên"
                disabled={!!doctor}
                maxLength={100}
                required
                {...register("fullName")}
              />
            </label>
            <label className="space-y-1.5 text-caption font-semibold">
              Số điện thoại
              <Input
                aria-label="Số điện thoại"
                disabled={!!doctor}
                required
                type="tel"
                {...register("phone")}
              />
            </label>
            {doctor && (
              <label className="space-y-1.5 text-caption font-semibold sm:col-span-2">
                Email
                <Input disabled value={doctor.user.email ?? ""} />
              </label>
            )}
            <label className="space-y-1.5 text-caption font-semibold">
              Mã bác sĩ
              <Input required maxLength={20} {...register("doctorCode")} />
            </label>
            <label className="space-y-1.5 text-caption font-semibold">
              Số chứng chỉ hành nghề
              <Input required maxLength={50} {...register("licenseNumber")} />
            </label>
            <label className="space-y-1.5 text-caption font-semibold">
              Chuyên khoa
              <Controller
                name="specialtyId"
                control={control}
                rules={{ required: "Chọn chuyên khoa." }}
                render={({ field }) => (
                  <Select {...field} required disabled={isSubmitting}>
                    <option value="">Chọn chuyên khoa</option>
                    {specialties
                      .filter((s) => s.isActive || s.id === doctor?.specialtyId)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                          {s.isActive ? "" : " (Tạm dừng)"}
                        </option>
                      ))}
                  </Select>
                )}
              />
            </label>
            <label className="space-y-1.5 text-caption font-semibold">
              Học hàm
              <Controller
                name="academicTitle"
                control={control}
                render={({ field }) => (
                  <Select {...field} disabled={isSubmitting}>
                    <option value="">Chưa cập nhật</option>
                    <option value="PROFESSOR">Giáo sư</option>
                    <option value="ASSOCIATE_PROFESSOR">Phó giáo sư</option>
                  </Select>
                )}
              />
            </label>
            <label className="space-y-1.5 text-caption font-semibold sm:col-span-2">
              Trình độ chuyên môn
              <Textarea maxLength={10000} {...register("qualification")} />
            </label>
            <label className="space-y-1.5 text-caption font-semibold sm:col-span-2">
              Giới thiệu
              <Textarea maxLength={10000} {...register("bio")} />
            </label>
            <div className="sm:col-span-2">
              <DoctorAvatarInput
                id="doctor-avatar"
                avatar={avatar}
                disabled={isSubmitting}
              />
            </div>
            {
              <label className="space-y-1.5 text-caption font-semibold">
                Phòng khám (theo chuyên khoa)
                <Input
                  disabled
                  value={
                    specialties.find((s) => s.id === selectedSpecialtyId)
                      ?.roomCode ?? "Chọn chuyên khoa"
                  }
                />
              </label>
            }
          </fieldset>
          {errors.specialtyId && (
            <p role="alert" className="px-5 pb-4 text-body text-error">
              {errors.specialtyId.message}
            </p>
          )}
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
            <Button
              type="submit"
              disabled={isSubmitting || !!avatar.error || !specialties.length}
            >
              {isSubmitting ? "Đang lưu..." : "Lưu hồ sơ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
