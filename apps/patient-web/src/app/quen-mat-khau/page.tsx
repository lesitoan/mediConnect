import type { Metadata } from "next";
import ForgotPasswordPage from "@/features/auth/components/ForgotPasswordPage";

export const metadata: Metadata = {
  title: "Quên mật khẩu | MediConnect",
};

export default function Page() {
  return <ForgotPasswordPage />;
}
