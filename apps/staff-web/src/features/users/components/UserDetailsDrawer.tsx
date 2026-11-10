"use client";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/shared/Loading";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/Drawer";
import { useGetUserQuery } from "../services/usersApi";
import {
  canManageUser,
  canChangeUserStatus,
  getUserRoleLabel,
  getUserStatusLabel,
  userErrorMessage,
} from "../utils";
import { PATIENT_TEXT_FIELDS, PATIENT_GENDER_LABELS } from "../userEditForm";
import type { User } from "../types/userTypes";
export function UserDetailsDrawer({
  user,
  isOpen,
  onClose,
  onEdit,
  onToggleStatus,
  canEdit,
  canLock,
}: {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (user: User) => void;
  onToggleStatus: (user: User) => void;
  canEdit: boolean;
  canLock: boolean;
}) {
  const detail = useGetUserQuery(user?.id ?? "", {
    skip: !user || !isOpen,
    refetchOnMountOrArgChange: true,
  });
  const current = detail.currentData;
  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      swipeDirection="right"
    >
      <DrawerContent className="sm:max-w-md">
        <DrawerHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
              {(current ?? user)?.initials}
            </div>
            <div className="min-w-0">
              <DrawerTitle>
                {(current ?? user)?.name ?? "Chi tiết tài khoản"}
              </DrawerTitle>
              <DrawerDescription>
                {current
                  ? getUserRoleLabel(current.role)
                  : "Thông tin tài khoản trên hệ thống"}
              </DrawerDescription>
            </div>
          </div>
        </DrawerHeader>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          {detail.isFetching ? (
            <Loading label="Đang tải chi tiết..." />
          ) : detail.isError ? (
            <div role="alert" className="space-y-3 text-error">
              {userErrorMessage(detail.error)}
              <Button variant="outline" onClick={() => detail.refetch()}>
                Thử lại
              </Button>
            </div>
          ) : (
            current && (
              <>
                <section className="rounded-app-xl border border-border bg-sidebar/40 p-4">
                  <h3 className="text-label font-bold uppercase text-muted">
                    Trạng thái tài khoản
                  </h3>
                  <p className="mt-2 text-body font-semibold">
                    {getUserStatusLabel(current.status)}
                  </p>
                </section>
                <section className="space-y-3 rounded-app-xl border border-border bg-surface p-4">
                  <h3 className="text-body font-bold">
                    Thông tin định danh & RBAC
                  </h3>
                  <dl className="space-y-2 text-caption">
                    {[
                      ["Vai trò hệ thống", getUserRoleLabel(current.role)],
                      ["ID tài khoản", current.id],
                      ...(current.code
                        ? [["Mã bác sĩ / bệnh nhân", current.code]]
                        : []),
                      ...(current.specialtyName
                        ? [["Chuyên khoa", current.specialtyName]]
                        : []),
                      ["Ngày khởi tạo", current.createdAt],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="flex items-start justify-between gap-3 border-b border-border py-1"
                      >
                        <dt className="shrink-0 text-muted">{label}</dt>
                        <dd className="break-all text-right font-medium">
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
                <section className="space-y-3 rounded-app-xl border border-border bg-surface p-4">
                  <h3 className="text-body font-bold">Kênh liên lạc</h3>
                  <p className="break-all rounded-app-md bg-sidebar/60 p-2.5 text-caption">
                    {current.email || "Chưa có email"}
                  </p>
                  <p className="rounded-app-md bg-sidebar/60 p-2.5 text-caption">
                    {current.phone || "Chưa có số điện thoại"}
                  </p>
                </section>
                {current.patientProfile && (
                  <section className="space-y-3 rounded-app-xl border border-border p-4">
                    <h3 className="text-body font-bold">Hồ sơ bệnh nhân</h3>
                    <dl className="space-y-2 text-caption">
                      {PATIENT_TEXT_FIELDS.map(({ name, label }) => (
                        <div key={name}>
                          <dt className="text-muted">{label}</dt>
                          <dd className="break-words">
                            {current.patientProfile?.[name] || "Chưa ghi nhận"}
                          </dd>
                        </div>
                      ))}
                      <div>
                        <dt className="text-muted">Giới tính</dt>
                        <dd>
                          {current.patientProfile.gender
                            ? PATIENT_GENDER_LABELS[
                                current.patientProfile.gender
                              ]
                            : "Chưa ghi nhận"}
                        </dd>
                      </div>
                    </dl>
                  </section>
                )}
                <section className="space-y-2 rounded-app-xl border border-border p-4 text-caption">
                  <h3 className="text-body font-bold">Thông tin đăng nhập</h3>
                  <p>Lần đăng nhập cuối: {current.lastLogin}</p>
                </section>
              </>
            )
          )}
        </div>
        <DrawerFooter className="flex-wrap gap-2">
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
          <Button
            variant="outline"
            disabled={
              !canEdit ||
              !current ||
              !canManageUser(current) ||
              detail.isFetching ||
              detail.isError
            }
            onClick={() => {
              if (current) onEdit(current);
            }}
          >
            Chỉnh sửa
          </Button>
          <Button
            variant={current?.status === "LOCKED" ? "default" : "destructive"}
            disabled={
              !canLock ||
              !current ||
              !canChangeUserStatus(current) ||
              detail.isFetching ||
              detail.isError
            }
            onClick={() => {
              if (current) onToggleStatus(current);
            }}
          >
            {current?.status === "LOCKED" ? "Mở khóa" : "Khóa TK"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
