import { StaffLayoutShell } from "@/components/layout/StaffLayoutShell";
export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StaffLayoutShell>{children}</StaffLayoutShell>;
}
