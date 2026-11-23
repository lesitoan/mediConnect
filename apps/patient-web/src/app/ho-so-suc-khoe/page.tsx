import type { Metadata } from "next";
import ProfilePage from "@/features/profiles/components/ProfilePage";

export const metadata: Metadata = {
  title: "Hồ sơ & Thông tin cá nhân | MediConnect",
};

export default function Page() {
  return <ProfilePage />;
}
