"use client";
import toast from "react-hot-toast";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
import { Loading } from "@/components/shared/Loading";
import { getVietnamDate } from "@/lib/dateUtils";
import { useGetAuthUserQuery } from "@/features/auth/services/authApi";
import {
  useGetUserQuery,
  useGetUserOptionsQuery,
  useUpdateUserMutation,
} from "../../services/usersApi";
import {
  getUserRoleLabel,
  normalizeUserPhone,
  userErrorMessage,
} from "../../utils";
import {
  buildUserUpdate,
  userEditValues,
  PATIENT_TEXT_FIELDS,
  PATIENT_GENDER_LABELS,
  type UserEditValues,
} from "../../userEditForm";
import type { User } from "../../types/userTypes";
interface Props {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  canAssignRole: boolean;
  canEditDoctor: boolean;
}
export function EditUserModal({
  user,
  isOpen,
  onClose,
  canAssignRole,
  canEditDoctor,
}: Props) {
  const detail = useGetUserQuery(user?.id ?? "", {
    skip: !isOpen || !user,
    refetchOnMountOrArgChange: true,
  });
  const [updateUser, request] = useUpdateUserMutation();
  const { refetch: refetchActor } = useGetAuthUserQuery();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  if (
    !editingUser &&
    detail.currentData &&
    !detail.isFetching &&
    !detail.isError
  )
    setEditingUser(detail.currentData);
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !request.isLoading) onClose();
      }}
      disablePointerDismissal={request.isLoading}
    >
      <DialogContent
        className="max-h-full max-w-lg"
        showCloseButton={!request.isLoading}
      >
        <DialogHeader className="shrink-0">
          <DialogTitle>Cập nhật thông tin tài khoản</DialogTitle>
        </DialogHeader>
        {!editingUser && detail.isFetching ? (
          <Loading label="Đang tải chi tiết tài khoản..." className="p-6" />
        ) : !editingUser && detail.isError ? (
          <div role="alert" className="space-y-3 p-5 text-error">
            {userErrorMessage(detail.error)}
            <Button variant="outline" onClick={() => detail.refetch()}>
              Thử lại
            </Button>
          </div>
        ) : (
          editingUser && (
            <EditUserForm
              key={editingUser.id}
              user={editingUser}
              canAssignRole={canAssignRole}
              canEditDoctor={canEditDoctor}
              isSubmitting={request.isLoading}
              error={request.isError ? userErrorMessage(request.error) : null}
              onClose={onClose}
              onSave={async (values) => {
                try {
                  const changes = buildUserUpdate(
                    editingUser,
                    values,
                    canAssignRole,
                    canEditDoctor,
                  );
                  if (Object.keys(changes).length === 1) {
                    toast("Chưa có thay đổi.");
                    return;
                  }
                  const updated = await updateUser(changes).unwrap();
                  if (updated.isCurrentUser) void refetchActor();
                  toast.success("Đã cập nhật tài khoản.");
                  onClose();
                } catch {
                  /* Keep the form open so the request error remains visible. */
                }
              }}
            />
          )
        )}
      </DialogContent>
    </Dialog>
  );
}
function EditUserForm({
  user,
  canAssignRole,
  canEditDoctor,
  isSubmitting,
  error,
  onClose,
  onSave,
}: {
  user: User;
  canAssignRole: boolean;
  canEditDoctor: boolean;
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (values: UserEditValues) => Promise<void>;
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<UserEditValues>({ defaultValues: userEditValues(user) });
  const options = useGetUserOptionsQuery(undefined, {
    skip: user.role !== "DOCTOR",
  });
  const canPromote =
    canAssignRole && !user.isCurrentUser && user.role === "RECEPTIONIST";
  return (
    <form
      onSubmit={handleSubmit(onSave)}
      className="min-h-0 overflow-y-auto p-5 sm:p-6"
      aria-busy={isSubmitting}
    >
      <fieldset
        disabled={isSubmitting}
        className="m-0 min-w-0 space-y-4 border-0 p-0"
      >
        <label className="block space-y-1.5 text-caption font-semibold">
          Họ và tên *
          <Input
            maxLength={100}
            {...register("fullName", {
              validate: (v) =>
                (!!v.trim() && /^[^\p{Cc}]+$/u.test(v)) ||
                "Họ tên không hợp lệ.",
            })}
          />
          {errors.fullName && (
            <span className="text-error">{errors.fullName.message}</span>
          )}
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="space-y-1.5 text-caption font-semibold">
            Email
            <Input
              readOnly
              value={user.email || "Chưa ghi nhận"}
              className="bg-neutral-bg text-muted"
            />
          </label>
          <label className="space-y-1.5 text-caption font-semibold">
            Số điện thoại
            <Input
              type="tel"
              readOnly={user.role === "PATIENT"}
              className={
                user.role === "PATIENT" ? "bg-neutral-bg text-muted" : undefined
              }
              maxLength={20}
              {...register("phone", {
                validate: (v) =>
                  user.role === "PATIENT" ||
                  /^\+84[35789]\d{8}$/.test(normalizeUserPhone(v)) ||
                  "Cần số điện thoại Việt Nam hợp lệ.",
              })}
            />
            {errors.phone && (
              <span className="text-error">{errors.phone.message}</span>
            )}
          </label>
        </div>
        <label className="block space-y-1.5 text-caption font-semibold">
          Vai trò (RBAC)
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                value={field.value ?? ""}
                disabled={!canPromote}
                className="disabled:bg-neutral-bg disabled:text-muted"
              >
                <option value={user.role ?? ""}>
                  {getUserRoleLabel(user.role)}
                </option>
                {canPromote && <option value="ADMIN">Quản trị viên</option>}
              </Select>
            )}
          />
        </label>
        {user.role === "DOCTOR" && (
          <label className="block space-y-1.5 text-caption font-semibold">
            Chuyên khoa
            <Controller
              name="specialtyId"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  disabled={
                    !canEditDoctor || options.isFetching || options.isError
                  }
                  className="disabled:bg-neutral-bg disabled:text-muted"
                >
                  <option value={user.specialtyId ?? ""}>
                    {user.specialtyName || "Chưa ghi nhận"}
                  </option>
                  {options.data?.specialties
                    .filter((s) => s.isActive && s.id !== user.specialtyId)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </Select>
              )}
            />
            {options.isError && (
              <span role="alert" className="text-error">
                {userErrorMessage(options.error)}{" "}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => options.refetch()}
                >
                  Thử lại
                </Button>
              </span>
            )}
          </label>
        )}
        {user.role === "PATIENT" && user.patientProfile && (
          <div className="space-y-3 rounded-app-lg border border-border p-3">
            <h3 className="text-body font-semibold">Hồ sơ bệnh nhân</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {PATIENT_TEXT_FIELDS.map(({ name, label, type, maxLength }) => (
                <label
                  key={name}
                  className="space-y-1.5 text-caption font-semibold"
                >
                  {label}
                  <Input
                    type={type}
                    maxLength={maxLength}
                    max={name === "dateOfBirth" ? getVietnamDate() : undefined}
                    {...register(name, {
                      validate: (value) => {
                        if (!value) return true;
                        if (name === "nationalId")
                          return (
                            /^[0-9]{12}$/.test(value) ||
                            "Số căn cước phải có 12 chữ số."
                          );
                        if (name === "emergencyContactPhone")
                          return (
                            /^\+84[35789]\d{8}$/.test(
                              normalizeUserPhone(value),
                            ) || "Số điện thoại không hợp lệ."
                          );
                        if (name === "dateOfBirth")
                          return (
                            value <= getVietnamDate() ||
                            "Ngày sinh không được ở tương lai."
                          );
                        return (
                          /^[^\p{Cc}]+$/u.test(value) ||
                          "Nội dung không hợp lệ."
                        );
                      },
                    })}
                  />
                  {errors[name] && (
                    <span className="text-error">{errors[name]?.message}</span>
                  )}
                </label>
              ))}
              <label className="space-y-1.5 text-caption font-semibold">
                Giới tính
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <Select {...field}>
                      <option value="">Chưa ghi nhận</option>
                      {Object.entries(PATIENT_GENDER_LABELS).map(
                        ([v, label]) => (
                          <option key={v} value={v}>
                            {label}
                          </option>
                        ),
                      )}
                    </Select>
                  )}
                />
              </label>
            </div>
          </div>
        )}
        {error && (
          <p role="alert" className="text-caption text-error">
            {error}
          </p>
        )}
        <DialogFooter className="-mx-5 -mb-5 sm:-mx-6 sm:-mb-6">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={onClose}
          >
            Hủy bỏ
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </DialogFooter>
      </fieldset>
    </form>
  );
}
