"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { AlertTriangle, ShieldCheck } from "lucide-react";
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
import { Textarea } from "@/components/ui/Textarea";
import type { User, ToggleUserStatusInput } from "../types/userTypes";

interface UserStatusModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (input: ToggleUserStatusInput) => void;
}

interface UserStatusFormData {
  reason: string;
  note: string;
}

export function UserStatusModal({
  user,
  isOpen,
  onClose,
  onConfirm,
}: UserStatusModalProps) {
  const { register, handleSubmit, reset } = useForm<UserStatusFormData>({
    defaultValues: {
      reason: "Thay đổi nhân sự / Nghỉ việc",
      note: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        reason: "Thay đổi nhân sự / Nghỉ việc",
        note: "",
      });
    }
  }, [isOpen, reset]);

  if (!user) return null;

  const isLocking = user.status !== "LOCKED";

  const onFormSubmit = (data: UserStatusFormData) => {
    const combinedReason = data.note?.trim()
      ? `${data.reason}: ${data.note.trim()}`
      : data.reason;

    onConfirm({
      userId: user.id,
      targetStatus: isLocking ? "LOCKED" : "ACTIVE",
      reason: combinedReason,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div
              className={`flex size-9 items-center justify-center rounded-full ${
                isLocking
                  ? "bg-danger-bg text-danger border border-danger/20"
                  : "bg-success-bg text-success border border-success/20"
              }`}
            >
              {isLocking ? (
                <AlertTriangle className="size-4.5" />
              ) : (
                <ShieldCheck className="size-4.5" />
              )}
            </div>
            <div>
              <DialogTitle>
                {isLocking ? "Khóa tài khoản người dùng" : "Mở khóa tài khoản"}
              </DialogTitle>
              <DialogDescription>
                {user.code} · {user.name}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)}>
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
                  <Select
                    {...register("reason")}
                    className="bg-surface border-input"
                  >
                    <option value="Thay đổi nhân sự / Nghỉ việc">
                      Thay đổi nhân sự / Nghỉ việc
                    </option>
                    <option value="Phát hiện đăng nhập bất thường">
                      Phát hiện đăng nhập bất thường / Nghi vấn bảo mật
                    </option>
                    <option value="Yêu cầu tạm ngưng từ Ban Giám đốc">
                      Yêu cầu tạm ngưng từ Ban Giám đốc
                    </option>
                    <option value="Vi phạm chính sách bảo mật HIPAA/BYT">
                      Vi phạm chính sách bảo mật HIPAA / BYT
                    </option>
                    <option value="Khác">Lý do khác</option>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-caption font-semibold text-foreground">
                    Ghi chú bổ sung
                  </label>
                  <Textarea
                    {...register("note")}
                    placeholder="Ghi chú chi tiết cho biên bản kiểm toán (Audit Log)..."
                    className="min-h-[70px] bg-surface border-input"
                  />
                </div>
              </>
            ) : (
              <p className="text-body text-muted">
                Bạn có chắc chắn muốn mở khóa tài khoản cho{" "}
                <strong className="text-foreground">{user.name}</strong>? Người dùng
                sẽ được phục hồi quyền truy cập bình thường theo phân quyền vai trò.
              </p>
            )}

            <DialogFooter className="-mx-5 -mb-5 sm:-mx-6 sm:-mb-6">
              <Button type="button" variant="outline" onClick={onClose}>
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                variant={isLocking ? "destructive" : "default"}
                className={
                  isLocking
                    ? "bg-danger text-primary-foreground hover:bg-danger/90"
                    : "bg-success text-primary-foreground hover:bg-success/90"
                }
              >
                {isLocking ? "Xác nhận khóa" : "Xác nhận mở khóa"}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
