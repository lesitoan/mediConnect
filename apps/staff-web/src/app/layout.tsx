import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MediConnect Staff",
  description: "Staff portal for MediConnect healthcare management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
