import type { Metadata } from "next";
import { Suspense } from "react";
import { Loading } from "@/components/shared/Loading";
import { ScheduleCalendarView } from "@/features/schedules/calendar/components";

export const metadata: Metadata = {
  title: "Lịch làm việc tuần | MediConnect Staff",
  description: "Phân công và quản lý ca trực hằng tuần của nhân sự y tế",
};

export default function ScheduleCalendarPage() {
  return (
    <Suspense fallback={<Loading className="min-h-screen" />}>
      <ScheduleCalendarView />
    </Suspense>
  );
}
