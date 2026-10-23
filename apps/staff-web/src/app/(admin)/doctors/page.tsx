import { Suspense } from "react";
import type { Metadata } from "next";
import { Loading } from "@/components/shared/Loading";
import { DoctorManagementView } from "@/features/doctors/components/DoctorManagementView";

export const metadata: Metadata = {
  title: "Quản lý Bác sĩ & Chuyên khoa | MediConnect Staff",
  description:
    "Theo dõi danh sách nhân sự y tế, quản lý phân công ca trực và định danh chuyên khoa",
};

export default function DoctorsPage() {
  return (
    <Suspense fallback={<Loading className="min-h-screen" />}>
      <DoctorManagementView />
    </Suspense>
  );
}
