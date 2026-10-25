import type { Metadata } from "next";
import PaymentPage from "@/features/payment/components/PaymentPage";

export const metadata: Metadata = {
  title: "Thanh toán viện phí | MediConnect",
};

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <PaymentPage code={code} />;
}