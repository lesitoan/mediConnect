import type { Metadata } from "next";
import { ConsultationListView } from "@/features/consultations/components";

export const metadata: Metadata = {
  title: "Khám bệnh ngoại trú | MediConnect Staff",
  description: "Quản lý các phiên khám trong ca làm việc",
};

export default function ConsultationsPage() {
  return <ConsultationListView />;
}
