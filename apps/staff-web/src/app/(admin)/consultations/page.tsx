import type { Metadata } from "next";
import { ExaminationManagementView } from "@/features/examinations/components/ExaminationManagementView";

export const metadata: Metadata = {
  title: "Khám bệnh ngoại trú | MediConnect Staff",
  description: "Quản lý các phiên khám trong ca làm việc",
};

export default function ConsultationsPage() {
  return <ExaminationManagementView />;
}
