import type { Metadata } from "next";
import "./globals.css";
import FloatingActions from "@/components/layout/FloatingActions";
import Footer from "@/components/layout/Footer";
import FooterGate from "@/components/layout/FooterGate";
import HeaderGate from "@/components/layout/HeaderGate";

export const metadata: Metadata = {
  title: "MediConnect",
  description: "Nền tảng quản lý khám chữa bệnh ngoại trú",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        <HeaderGate />
        <main>{children}</main>
        <FooterGate>
          <Footer />
        </FooterGate>
        <FloatingActions />
      </body>
    </html>
  );
}