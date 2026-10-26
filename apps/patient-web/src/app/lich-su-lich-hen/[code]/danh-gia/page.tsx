import type { Metadata } from "next";
import ReviewPage from "@/features/review/components/ReviewPage";

export const metadata: Metadata = {
  title: "Đánh giá phiên khám bệnh | MediConnect",
};

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <ReviewPage code={code} />;
}