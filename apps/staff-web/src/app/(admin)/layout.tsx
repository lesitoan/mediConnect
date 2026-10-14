import type { Metadata } from "next";
import { StaffLayoutShell } from "@/components/layout/StaffLayoutShell";

export const metadata: Metadata = {
  title: "Quản trị viên | MediConnect Staff",
  description: "Cổng điều hành và quản lý nhân sự y tế MediConnect",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StaffLayoutShell>{children}</StaffLayoutShell>;
}
