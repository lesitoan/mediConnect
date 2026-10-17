"use client";

import * as React from "react";
import {
  X,
  ShieldCheck,
  Mail,
  Phone,
  Building,
  Lock,
  Unlock,
  Edit2,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/Drawer";
import type { User } from "../types/userTypes";

interface UserDetailsDrawerProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (user: User) => void;
  onToggleStatus: (user: User) => void;
}

export function UserDetailsDrawer({
  user,
  isOpen,
  onClose,
  onEdit,
  onToggleStatus,
}: UserDetailsDrawerProps) {
  const lastUserRef = React.useRef<User | null>(user);
  if (user) {
    lastUserRef.current = user;
  }
  const activeUser = user ?? lastUserRef.current;

  if (!activeUser) return null;

  const isLocked = activeUser.status === "LOCKED";
  const isPendingOtp = activeUser.status === "PENDING_OTP";

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      swipeDirection="right"
    >
      <DrawerContent className="sm:max-w-[440px]">
        <DrawerHeader className="flex-row items-start justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground shadow-xs select-none">
              {activeUser.initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="rounded-app-sm bg-primary-light px-2 py-0.5 text-label font-bold text-primary border border-primary/20">
                  {activeUser.code}
                </span>
                {activeUser.isCurrentUser && (
                  <span className="rounded-app-sm bg-brand-secondary-light px-1.5 py-0.5 text-label font-bold text-primary">
                    Bạn
                  </span>
                )}
              </div>
              <DrawerTitle className="mt-0.5 truncate">
                {activeUser.name}
              </DrawerTitle>
              <DrawerDescription className="truncate">
                {activeUser.department}
              </DrawerDescription>
            </div>
          </div>

          <DrawerClose
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="text-muted hover:text-foreground shrink-0"
                aria-label="Đóng"
                onClick={onClose}
              >
                <X className="size-4" />
              </Button>
            }
          />
        </DrawerHeader>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <div className="rounded-app-xl border border-border bg-sidebar/40 p-4">
            <span className="text-label font-bold text-muted uppercase tracking-wider">
              Trạng thái tài khoản
            </span>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-body font-semibold text-foreground">
                Tình trạng vận hành
              </span>
              {isLocked ? (
                <span className="rounded-full bg-danger-bg px-2.5 py-1 text-label font-bold text-danger border border-danger/20">
                  Đã khóa
                </span>
              ) : isPendingOtp ? (
                <span className="rounded-full bg-warning-bg px-2.5 py-1 text-label font-bold text-warning border border-warning/20">
                  Chờ kích hoạt OTP
                </span>
              ) : (
                <span className="rounded-full bg-success-bg px-2.5 py-1 text-label font-bold text-success border border-success/20">
                  Đang hoạt động
                </span>
              )}
            </div>
          </div>

          <div className="space-y-3 rounded-app-xl border border-border bg-surface p-4">
            <div className="flex items-center gap-2 text-body font-bold text-foreground">
              <ShieldCheck className="size-4 text-primary" />
              <span>Thông tin định danh & RBAC</span>
            </div>

            <div className="space-y-2 text-caption">
              <div className="flex items-center justify-between py-1 border-b border-border">
                <span className="text-muted">Vai trò hệ thống</span>
                <span className="font-bold text-foreground">{activeUser.role}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-border">
                <span className="text-muted">Mã số tài khoản</span>
                <span className="font-bold text-primary">{activeUser.code}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-border">
                <span className="text-muted">Đơn vị quản lý</span>
                <span className="font-medium text-foreground">{activeUser.department}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-muted">Ngày khởi tạo</span>
                <span className="font-medium text-foreground">{activeUser.createdAt}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-app-xl border border-border bg-surface p-4">
            <div className="flex items-center gap-2 text-body font-bold text-foreground">
              <Building className="size-4 text-primary" />
              <span>Kênh liên lạc</span>
            </div>

            <div className="space-y-2 text-caption">
              <div className="flex items-center gap-2 rounded-app-md bg-sidebar/60 p-2.5">
                <Mail className="size-3.5 text-primary" />
                <span className="font-medium text-foreground">{activeUser.email}</span>
              </div>
              <div className="flex items-center gap-2 rounded-app-md bg-sidebar/60 p-2.5">
                <Phone className="size-3.5 text-primary" />
                <span className="font-medium text-foreground">{activeUser.phone}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-app-xl border border-border bg-surface p-4">
            <div className="flex items-center gap-2 text-body font-bold text-foreground">
              <KeyRound className="size-4 text-primary" />
              <span>Bảo mật & Kiểm toán</span>
            </div>

            <div className="space-y-2 text-caption">
              <div className="flex items-center justify-between">
                <span className="text-muted">Xác thực 2 bước (2FA)</span>
                <span
                  className={`font-semibold ${
                    activeUser.twoFactorEnabled ? "text-success" : "text-danger"
                  }`}
                >
                  {activeUser.twoFactorEnabled ? "Đã kích hoạt" : "Chưa thiết lập"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Lần đăng nhập cuối</span>
                <span className="font-medium text-foreground">
                  {activeUser.lastLogin || "Không có dữ liệu"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <DrawerFooter>
          <DrawerClose
            render={
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Đóng
              </Button>
            }
          />

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                onEdit(activeUser);
              }}
              className="gap-1.5 font-semibold text-primary border-border hover:bg-secondary/50"
            >
              <Edit2 className="size-3.5" />
              <span>Chỉnh sửa</span>
            </Button>

            {!activeUser.isCurrentUser && (
              <Button
                type="button"
                variant={isLocked ? "default" : "destructive"}
                size="sm"
                onClick={() => {
                  onClose();
                  onToggleStatus(activeUser);
                }}
                className={
                  isLocked
                    ? "gap-1.5 bg-success text-primary-foreground hover:bg-success/90"
                    : "gap-1.5 bg-danger text-primary-foreground hover:bg-danger/90"
                }
              >
                {isLocked ? (
                  <>
                    <Unlock className="size-3.5" />
                    <span>Mở khóa</span>
                  </>
                ) : (
                  <>
                    <Lock className="size-3.5" />
                    <span>Khóa TK</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
