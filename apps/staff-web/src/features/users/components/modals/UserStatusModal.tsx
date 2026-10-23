"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Loading } from "@/components/shared/Loading";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { LOCK_REASON_OPTIONS } from "../../constants";
import { useUpdateUserStatusMutation } from "../../services/usersApi";
import type { User } from "../../types/userTypes";

interface UserStatusModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

interface UserStatusFormData {
  reason: string;
  note: string;
}

export function UserStatusModal({
  user,
  isOpen,
  onClose,
}: UserStatusModalProps) {
  const [updateUserStatus, { isLoading: isSubmitting, isError, reset: resetMutation }] =
    useUpdateUserStatusMutation();
  const { register, handleSubmit, reset } = useForm<UserStatusFormData>({
    defaultValues: {
      reason: LOCK_REASON_OPTIONS[0].value,
      note: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      resetMutation();
      reset({
        reason: LOCK_REASON_OPTIONS[0].value,
        note: "",
      });
    }
  }, [isOpen, reset, resetMutation]);

  if (!user) return null;

  const isLocking = user.status !== "LOCKED";

  const onFormSubmit = async (data: UserStatusFormData) => {
    if (isSubmitting) return;
    const combinedReason = data.note?.trim()
      ? `${data.reason}: ${data.note.trim()}`
      : data.reason;

    try {
      const result = await updateUserStatus({
      userId: user.id,
      targetStatus: isLocking ? "LOCKED" : "ACTIVE",
      reason: combinedReason,
      }).unwrap();
      toast.success(result.message);
      onClose();
    } catch {
      // Mutation error is shown inline.
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !isSubmitting && onClose()}
      disablePointerDismissal={isSubmitting}
    >
      <DialogContent className="max-w-md" showCloseButton={!isSubmitting}>
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div>
              <DialogTitle>
                {isLocking ? "Khóa tài khoản người dùng" : "Mở khóa tài khoản"}
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} aria-busy={isSubmitting}>
          <fieldset
            disabled={isSubmitting}
            className="m-0 min-w-0 border-0 p-0"
          >
            <div className="space-y-4 p-5 sm:p-6">
              {isLocking ? (
                <>
                  <p className="text-body text-muted">
                  Khi bị khóa, người dùng này sẽ lập tức bị đăng xuất khỏi hệ thống và không thể đăng nhập cho tới khi được quản trị viên mở khóa trở lại.
                  </p>

                  <div className="space-y-1.5">
                    <label className="text-caption font-semibold text-foreground">
                      Lý do khóa tài khoản
                    </label>
                    <Select {...register("reason")}>
                      {LOCK_REASON_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-caption font-semibold text-foreground">
                      Ghi chú bổ sung
                    </label>
                    <Textarea
                      {...register("note")}
                      placeholder="Ghi chú chi tiết cho biên bản kiểm toán (Audit Log)..."
                      className="min-h-[70px]"
                    />
                  </div>
                </>
              ) : (
                <p className="text-body text-muted">
                  Bạn có chắc chắn muốn mở khóa tài khoản cho{" "}
                  <strong className="text-foreground">{user.name}</strong>?
                  Người dùng sẽ được phục hồi quyền truy cập bình thường theo
                  phân quyền vai trò.
                </p>
              )}

              {isError && (
                <p role="alert" className="text-caption text-error">
                  Đổi trạng thái thất bại. Vui lòng thử lại.
                </p>
              )}

              <DialogFooter className="-mx-5 -mb-5 sm:-mx-6 sm:-mb-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="h-8.5 px-4 text-body font-medium"
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  variant={isLocking ? "destructive" : "default"}
                  className={cn(
                    "h-8.5 px-4 text-body font-semibold text-primary-foreground",
                    isLocking
                      ? "bg-danger hover:bg-danger/90"
                      : "bg-success hover:bg-success/90",
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loading
                        size="sm"
                        label="Đang xử lý..."
                        iconClassName="text-current"
                      />
                      Đang xử lý...
                    </>
                  ) : isLocking ? (
                    "Xác nhận khóa"
                  ) : (
                    "Xác nhận mở khóa"
                  )}
                </Button>
              </DialogFooter>
            </div>
          </fieldset>
        </form>
      </DialogContent>
    </Dialog>
  );
}
