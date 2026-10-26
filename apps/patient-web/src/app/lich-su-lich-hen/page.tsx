import type { Metadata } from "next";
import AppointmentHistoryPage from "@/features/appointments/components/AppointmentHistoryPage";

export const metadata: Metadata = {
  title: "Lịch sử khám & Lịch hẹn | MediConnect",
};

export default function Page() {
  return <AppointmentHistoryPage />;
}