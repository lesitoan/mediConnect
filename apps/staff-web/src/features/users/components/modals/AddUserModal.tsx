"use client";
import toast from "react-hot-toast";
import { Controller, useForm, useWatch } from "react-hook-form";
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
import {
  useCreateUserMutation,
  useGetUserOptionsQuery,
} from "../../services/usersApi";
import { useStaffEmailPreview } from "../../hooks/useStaffEmailPreview";
import { normalizeUserPhone, userErrorMessage } from "../../utils";
import type { CreateUserInput } from "../../types/userTypes";
interface AddUserFormData {
  fullName: string;
  phone: string;
  role: CreateUserInput["role"];
  specialtyId: string;
  doctorCode: string;
  licenseNumber: string;
}
export function AddUserModal({
  isOpen,
  onClose,
  canCreateDoctor,
}: {
  isOpen: boolean;
  onClose: () => void;
  canCreateDoctor: boolean;
}) {
  const [createUser, request] = useCreateUserMutation();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<AddUserFormData>({
    shouldUnregister: true,
    defaultValues: {
      fullName: "",
      phone: "",
      role: "RECEPTIONIST",
      specialtyId: "",
      doctorCode: "",
      licenseNumber: "",
    },
  });
  const role = useWatch({ control, name: "role" });
  const fullName = useWatch({ control, name: "fullName" });
  const preview = useStaffEmailPreview(fullName, isOpen);
  const options = useGetUserOptionsQuery(undefined, {
    skip: role !== "DOCTOR",
  });
  const onSubmit = async (values: AddUserFormData) => {
    if (request.isLoading || (values.role === "DOCTOR" && !canCreateDoctor))
      return;
    try {
      const user = await createUser({
        fullName: values.fullName.trim(),
        phone: normalizeUserPhone(values.phone),
        role: values.role,
        ...(values.role === "DOCTOR"
          ? {
              doctor: {
                specialtyId: values.specialtyId,
                doctorCode: values.doctorCode.trim(),
                licenseNumber: values.licenseNumber.trim(),
                academicTitle: null,
                qualification: null,
                bio: null,
                avatarUrl: null,
              },
            }
          : {}),
      }).unwrap();
      toast.success("Đã tạo tài khoản: " + user.email);
      onClose();
    } catch {
      /* Keep the form open so the request error remains visible. */
    }
  };
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
          <DialogTitle>Tạo tài khoản người dùng mới</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="min-h-0 overflow-y-auto p-5 sm:p-6"
          aria-busy={request.isLoading}
        >
          <fieldset
            disabled={request.isLoading}
            className="m-0 min-w-0 space-y-4 border-0 p-0"
          >
            <label className="block space-y-1.5 text-caption font-semibold">
              Họ và tên người dùng *
              <Input
                maxLength={100}
                {...register("fullName", {
                  required: "Vui lòng nhập họ tên.",
                  validate: (v) =>
                    (!!v.trim() && /^[^\p{Cc}]+$/u.test(v)) ||
                    "Họ tên không hợp lệ.",
                })}
                placeholder="VD: Nguyễn Văn An"
              />
              {errors.fullName && (
                <span className="text-error">{errors.fullName.message}</span>
              )}
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="space-y-1.5 text-caption font-semibold">
                Email tự động
                <Input
                  aria-label="Email tự động"
                  readOnly
                  value={preview.email}
                  placeholder={
                    preview.isLoading
                      ? "Đang tạo email xem trước..."
                      : "Nhập họ tên để xem trước"
                  }
                  className="bg-neutral-bg text-muted"
                />
              </label>
              <label className="space-y-1.5 text-caption font-semibold">
                Số điện thoại *
                <Input
                  type="tel"
                  maxLength={20}
                  {...register("phone", {
                    required: "Vui lòng nhập số điện thoại.",
                    validate: (v) =>
                      /^\+84[35789]\d{8}$/.test(normalizeUserPhone(v)) ||
                      "Số điện thoại Việt Nam không hợp lệ.",
                  })}
                  placeholder="0912345678"
                />
                {errors.phone && (
                  <span className="text-error">{errors.phone.message}</span>
                )}
              </label>
            </div>
            <p className="text-caption text-muted">
              Email hiển thị là dự kiến; hệ thống chốt email khi tạo tài khoản.
            </p>
            {preview.error && (
              <p role="alert" className="text-caption text-error">
                {preview.error}
              </p>
            )}
            <label className="block space-y-1.5 text-caption font-semibold">
              Vai trò truy cập *
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <Select {...field}>
                    <option value="RECEPTIONIST">Lễ tân</option>
                    <option value="ADMIN">Quản trị viên</option>
                    {canCreateDoctor && <option value="DOCTOR">Bác sĩ</option>}
                  </Select>
                )}
              />
            </label>
            {role === "DOCTOR" && (
              <div className="space-y-3 rounded-app-lg border border-border p-3">
                <label className="block space-y-1.5 text-caption font-semibold">
                  Chuyên khoa *
                  <Controller
                    name="specialtyId"
                    control={control}
                    rules={{ required: "Chọn chuyên khoa." }}
                    render={({ field }) => (
                      <Select
                        {...field}
                        disabled={options.isFetching || options.isError}
                      >
                        <option value="">Chọn chuyên khoa</option>
                        {options.data?.specialties
                          .filter((s) => s.isActive)
                          .map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                      </Select>
                    )}
                  />
                  {errors.specialtyId && (
                    <span className="text-error">
                      {errors.specialtyId.message}
                    </span>
                  )}
                </label>
                {options.isError && (
                  <p role="alert" className="text-caption text-error">
                    {userErrorMessage(options.error)}{" "}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => options.refetch()}
                    >
                      Thử lại
                    </Button>
                  </p>
                )}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="space-y-1.5 text-caption font-semibold">
                    Mã bác sĩ *
                    <Input
                      maxLength={20}
                      {...register("doctorCode", {
                        required: role === "DOCTOR" && "Nhập mã bác sĩ.",
                        pattern: {
                          value: /^[a-zA-Z0-9]+(?:[._-][a-zA-Z0-9]+)*$/,
                          message: "Mã bác sĩ không hợp lệ.",
                        },
                      })}
                    />
                    {errors.doctorCode && (
                      <span className="text-error">
                        {errors.doctorCode.message}
                      </span>
                    )}
                  </label>
                  <label className="space-y-1.5 text-caption font-semibold">
                    Số giấy phép hành nghề *
                    <Input
                      maxLength={50}
                      {...register("licenseNumber", {
                        validate: (v) =>
                          role !== "DOCTOR" ||
                          !!v?.trim() ||
                          "Nhập số giấy phép.",
                      })}
                    />
                    {errors.licenseNumber && (
                      <span className="text-error">
                        {errors.licenseNumber.message}
                      </span>
                    )}
                  </label>
                </div>
              </div>
            )}
            {request.isError && (
              <p role="alert" className="text-caption text-error">
                {userErrorMessage(request.error)}
              </p>
            )}
            <DialogFooter className="-mx-5 -mb-5 sm:-mx-6 sm:-mb-6">
              <Button
                type="button"
                variant="outline"
                disabled={request.isLoading}
                onClick={onClose}
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={
                  request.isLoading ||
                  (role === "DOCTOR" && (options.isFetching || options.isError))
                }
              >
                {request.isLoading ? "Đang tạo..." : "Tạo tài khoản"}
              </Button>
            </DialogFooter>
          </fieldset>
        </form>
      </DialogContent>
    </Dialog>
  );
}
