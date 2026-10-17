"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { DEPARTMENTS } from "../../constants";
import type { CreateUserInput, UserRole } from "../../types/userTypes";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateUserInput) => void;
}

interface AddUserFormData {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  department: string;
  sendOtp: boolean;
}

export function AddUserModal({ isOpen, onClose, onSubmit }: AddUserModalProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<AddUserFormData>({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      role: "DOCTOR",
      department: DEPARTMENTS[0],
      sendOtp: true,
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        name: "",
        email: "",
        phone: "",
        role: "DOCTOR",
        department: DEPARTMENTS[0],
        sendOtp: true,
      });
    }
  }, [isOpen, reset]);

  const onFormSubmit = (data: AddUserFormData) => {
    onSubmit({
      name: data.name.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      role: data.role,
      department: data.department,
      sendOtp: data.sendOtp,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Tạo tài khoản người dùng mới</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 p-5 sm:p-6">
          <div className="space-y-1.5">
            <label className="text-caption font-semibold text-foreground">
              Họ và tên người dùng <span className="text-error">*</span>
            </label>
            <Input
              {...register("name", {
                required: "Vui lòng nhập họ và tên",
              })}
              placeholder="VD: BS. Nguyễn Tuấn Kiệt"
              className="bg-surface border-input"
            />
            {errors.name && (
              <span className="text-caption text-error">{errors.name.message}</span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-caption font-semibold text-foreground">
                Địa chỉ Email <span className="text-error">*</span>
              </label>
              <Input
                type="email"
                {...register("email", {
                  required: "Vui lòng nhập địa chỉ email",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Vui lòng nhập địa chỉ email hợp lệ",
                  },
                })}
                placeholder="VD: user@mediconnect.vn"
                className="bg-surface border-input"
              />
              {errors.email && (
                <span className="text-caption text-error">{errors.email.message}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-caption font-semibold text-foreground">
                Số điện thoại liên hệ <span className="text-error">*</span>
              </label>
              <Input
                {...register("phone", {
                  required: "Vui lòng nhập số điện thoại",
                })}
                placeholder="VD: +84 912 345 678"
                className="bg-surface border-input"
              />
              {errors.phone && (
                <span className="text-caption text-error">{errors.phone.message}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-caption font-semibold text-foreground">
                Vai trò truy cập (RBAC) <span className="text-error">*</span>
              </label>
              <Select
                {...register("role")}
                className="bg-surface border-input"
              >
                <option value="DOCTOR">Bác sĩ</option>
                <option value="RECEPTIONIST">Lễ tân</option>
                <option value="ADMIN">Quản trị viên</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="PATIENT">Bệnh nhân</option>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-caption font-semibold text-foreground">
                Khoa / Bộ phận công tác <span className="text-error">*</span>
              </label>
              <Select
                {...register("department")}
                className="bg-surface border-input"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-app-md border border-border bg-sidebar/50 p-3">
            <Controller
              name="sendOtp"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="send-otp"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                />
              )}
            />
            <label
              htmlFor="send-otp"
              className="text-caption font-medium text-foreground cursor-pointer"
            >
              Yêu cầu xác thực tài khoản qua OTP
            </label>
          </div>

          <DialogFooter className="-mx-5 -mb-5 sm:-mx-6 sm:-mb-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-8.5 px-4 text-body font-medium"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              className="h-8.5 bg-primary px-4 text-body font-semibold text-primary-foreground hover:bg-primary-hover"
            >
              Tạo tài khoản
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
