import type { Metadata } from "next";
import SpecialtiesPage from "@/features/specialties/components/SpecialtiesPage";

export const metadata: Metadata = {
  title: "Khám phá chuyên khoa | MediConnect",
};

export default function Page() {
  return <SpecialtiesPage />;
}