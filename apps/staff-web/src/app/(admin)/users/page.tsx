import { Suspense } from "react";
import type { Metadata } from "next";
import { Loading } from "@/components/shared/Loading";
import { UserManagementView } from "@/features/users/components";

export const metadata: Metadata = {
  title: "Quản lý tài khoản người dùng | MediConnect Staff",
  description:
    "Quản lý tài khoản người dùng, phân quyền RBAC và kiểm soát truy cập hệ thống",
};

export default function UsersPage() {
  return (
    <Suspense fallback={<Loading className="min-h-screen" />}>
      <UserManagementView />
    </Suspense>
  );
}
