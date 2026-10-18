"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/button";
import { useDeleteUserMutation } from "../../services/usersApi";
import type { User } from "../../types/userTypes";

interface DeleteUserModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteUserModal({
  user,
  isOpen,
  onClose,
}: DeleteUserModalProps) {
  const [deleteUser, { isLoading: isSubmitting, isError, reset: resetMutation }] =
    useDeleteUserMutation();

  useEffect(() => {
    if (isOpen) resetMutation();
  }, [isOpen, resetMutation]);

  if (!user) return null;

  const handleConfirm = async () => {
    if (isSubmitting || user.isCurrentUser) return;

    try {
      const result = await deleteUser(user.id).unwrap();
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
          <DialogTitle>Xóa tài khoản người dùng</DialogTitle>
        </DialogHeader>
        <form
          aria-busy={isSubmitting}
          onSubmit={(event) => {
            event.preventDefault();
            void handleConfirm();
          }}
        >
          <div className="space-y-3 p-5 sm:p-6">
            <DialogDescription>
              Bạn có chắc chắn muốn xóa tài khoản <strong>{user.name}</strong>?
            </DialogDescription>
            {isError && (
              <p role="alert" className="text-caption text-error">
                Xóa tài khoản thất bại. Vui lòng thử lại.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isSubmitting || user.isCurrentUser}
            >
              {isSubmitting ? "Đang xóa..." : "Xác nhận xóa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
