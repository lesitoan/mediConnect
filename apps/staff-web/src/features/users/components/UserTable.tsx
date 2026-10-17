"use client";

import { Edit2, Lock, Unlock, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import type { User, UserRole, UserStatus } from "../types/userTypes";
import { getUserRoleLabel, getUserStatusLabel } from "../utils";

interface UserTableProps {
  users: User[];
  page?: number;
  pageSize?: number;
  onEditUser: (user: User) => void;
  onToggleStatus: (user: User) => void;
  onViewDetails: (user: User) => void;
}

export function UserTable({
  users,
  page,
  pageSize,
  onEditUser,
  onToggleStatus,
  onViewDetails,
}: UserTableProps) {
  const renderRoleBadge = (role: UserRole) => {
    switch (role) {
      case "SUPER_ADMIN":
        return (
          <Badge variant="brand" shape="pill" size="sm" className="font-bold">
            <span className="size-1.5 rounded-full bg-primary" />
            <span>{getUserRoleLabel(role)}</span>
          </Badge>
        );
      case "ADMIN":
        return (
          <Badge variant="brand" shape="pill" size="sm" className="font-semibold">
            <span className="size-1.5 rounded-full bg-primary" />
            <span>{getUserRoleLabel(role)}</span>
          </Badge>
        );
      case "DOCTOR":
        return (
          <Badge variant="secondary" shape="pill" size="sm" className="font-semibold text-primary">
            <span className="size-1.5 rounded-full bg-primary" />
            <span>{getUserRoleLabel(role)}</span>
          </Badge>
        );
      case "RECEPTIONIST":
        return (
          <Badge variant="tertiary" shape="pill" size="sm" className="font-semibold">
            <span className="size-1.5 rounded-full bg-brand-tertiary-foreground" />
            <span>{getUserRoleLabel(role)}</span>
          </Badge>
        );
      case "PATIENT":
        return (
          <Badge variant="neutral" shape="pill" size="sm" className="font-semibold">
            <span className="size-1.5 rounded-full bg-muted" />
            <span>{getUserRoleLabel(role)}</span>
          </Badge>
        );
    }
  };

  const renderStatusBadge = (status: UserStatus) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge variant="success" shape="pill" size="sm" className="font-semibold">
            <span className="size-1.5 rounded-full bg-success" />
            <span>{getUserStatusLabel(status)}</span>
          </Badge>
        );
      case "PENDING_OTP":
        return (
          <Badge variant="warning" shape="pill" size="sm" className="font-semibold">
            <span className="size-1.5 rounded-full bg-warning" />
            <span>{getUserStatusLabel(status)}</span>
          </Badge>
        );
      case "LOCKED":
        return (
          <Badge variant="danger" shape="pill" size="sm" className="font-bold">
            <span className="size-1.5 rounded-full bg-danger" />
            <span>{getUserStatusLabel(status)}</span>
          </Badge>
        );
    }
  };

  return (
    <Table className="min-w-[940px] text-left">
      <TableHeader>
        <TableRow className="border-b border-border bg-sidebar/70 hover:bg-sidebar/70">
          <TableHead className="w-[60px] px-3.5 py-3 text-body font-bold tracking-wider text-muted">
            Stt
          </TableHead>
          <TableHead className="min-w-[240px] px-3.5 py-3 text-body font-bold tracking-wider text-muted">
            Họ và tên
          </TableHead>
          <TableHead className="min-w-[220px] px-3.5 py-3 text-body font-bold tracking-wider text-muted">
            Email / Liên hệ
          </TableHead>
          <TableHead className="w-[120px] px-3 py-3 text-body font-bold tracking-wider text-muted">
            Vai trò
          </TableHead>
          <TableHead className="w-[110px] px-3 py-3 text-body font-bold tracking-wider text-muted">
            Trạng thái
          </TableHead>
          <TableHead className="w-[96px] px-3 py-3 text-body font-bold tracking-wider text-muted">
            Ngày tạo
          </TableHead>
          <TableHead className="w-[90px] px-3.5 py-3 text-right text-body font-bold tracking-wider text-muted">
            Thao tác
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="divide-y divide-border">
        {users.map((user, index) => {
          const stt =
            page && pageSize ? (page - 1) * pageSize + index + 1 : index + 1;
          const isLocked = user.status === "LOCKED";

          return (
            <TableRow key={user.id}>
              <TableCell className="w-[60px] px-3.5 py-3 align-middle">
                <span className="text-body font-semibold text-muted tabular-nums">
                  {stt}
                </span>
              </TableCell>

              <TableCell className="min-w-[240px] px-3.5 py-2.5 align-middle">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-caption font-bold text-primary-foreground shadow-xs select-none">
                    {user.initials}
                  </div>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onViewDetails(user)}
                        className="truncate text-left text-body font-bold text-foreground hover:text-primary hover:underline"
                      >
                        {user.name}
                      </button>
                      {user.isCurrentUser && (
                        <span className="rounded-app-sm bg-brand-secondary-light px-1.5 py-0.5 text-label font-bold text-primary">
                          Bạn
                        </span>
                      )}
                    </div>
                    <span className="truncate text-caption text-muted">
                      {user.department}
                    </span>
                  </div>
                </div>
              </TableCell>

              <TableCell className="min-w-[220px] px-3.5 py-2.5 align-middle">
                <div className="flex flex-col gap-0.5">
                  <span className="truncate text-body font-medium text-foreground">
                    {user.email}
                  </span>
                  <span className="text-caption text-muted tabular-nums">
                    {user.phone}
                  </span>
                </div>
              </TableCell>

              <TableCell className="w-[120px] px-3 py-3 align-middle">
                {renderRoleBadge(user.role)}
              </TableCell>

              <TableCell className="w-[110px] px-3 py-3 align-middle">
                {renderStatusBadge(user.status)}
              </TableCell>

              <TableCell className="w-[96px] px-3 py-3 text-body text-muted tabular-nums align-middle">
                {user.createdAt}
              </TableCell>

              <TableCell className="w-[90px] px-3.5 py-2.5 text-right align-middle">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => onEditUser(user)}
                    className="size-8 rounded-app-md bg-primary-light text-primary hover:bg-secondary"
                    title="Chỉnh sửa thông tin"
                    aria-label="Chỉnh sửa thông tin"
                  >
                    <Edit2 className="size-3.5" />
                  </Button>

                  {user.isCurrentUser ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      disabled
                      className="size-8 rounded-app-md bg-secondary/40 text-muted/40 cursor-not-allowed"
                      title="Không thể khóa tài khoản của chính mình"
                      aria-label="Không thể khóa tài khoản chính mình"
                    >
                      <Lock className="size-3.5" />
                    </Button>
                  ) : isLocked ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onToggleStatus(user)}
                      className="size-8 rounded-app-md bg-success-bg text-success hover:bg-success-bg/80"
                      title="Mở khóa tài khoản"
                      aria-label="Mở khóa tài khoản"
                    >
                      <Unlock className="size-3.5" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onToggleStatus(user)}
                      className="size-8 rounded-app-md bg-danger-bg text-danger hover:bg-danger-bg-hover"
                      title="Khóa tài khoản"
                      aria-label="Khóa tài khoản"
                    >
                      <Lock className="size-3.5" />
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => onViewDetails(user)}
                    className="size-8 rounded-app-md bg-secondary/60 text-muted hover:bg-secondary hover:text-foreground"
                    title="Xem chi tiết"
                    aria-label="Xem chi tiết"
                  >
                    <MoreVertical className="size-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
