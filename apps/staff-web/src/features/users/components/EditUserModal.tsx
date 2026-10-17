"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { DEPARTMENTS } from "../constants";
import type { User, UpdateUserInput, UserRole } from "../types/userTypes";

interface EditUserModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (input: UpdateUserInput) => void;
}

interface EditUserFormData {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  department: string;
}

export function EditUserModal({
  user,
  isOpen,
  onClose,
  onSave,
}: EditUserModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditUserFormData>({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      role: "DOCTOR",
      department: DEPARTMENTS[0],
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        department: user.department,
      });
    }
  }, [user, reset]);

  if (!user) return null;

  const onFormSubmit = (data: EditUserFormData) => {
    onSave({
      id: user.id,
      name: data.name.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      role: data.role,
      department: data.department,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Cập nhật thông tin tài khoản</DialogTitle>
          <DialogDescription>
            Mã tài khoản: <span className="font-bold text-primary">{user.code}</span> · {user.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 p-5 sm:p-6">
          <div className="space-y-1.5">
            <label className="text-caption font-semibold text-foreground">
              Họ và tên <span className="text-error">*</span>
            </label>
            <Input
              {...register("name", {
                required: "Vui lòng nhập họ và tên",
              })}
              className="bg-surface border-input"
            />
            {errors.name && (
              <span className="text-caption text-error">{errors.name.message}</span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-caption font-semibold text-foreground">
                Email <span className="text-error">*</span>
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
                className="bg-surface border-input"
              />
              {errors.email && (
                <span className="text-caption text-error">{errors.email.message}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-caption font-semibold text-foreground">
                Số điện thoại <span className="text-error">*</span>
              </label>
              <Input
                {...register("phone", {
                  required: "Vui lòng nhập số điện thoại",
                })}
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
                Vai trò (RBAC) <span className="text-error">*</span>
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
                Khoa / Bộ phận <span className="text-error">*</span>
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

          <DialogFooter className="-mx-5 -mb-5 sm:-mx-6 sm:-mb-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary-hover"
            >
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
