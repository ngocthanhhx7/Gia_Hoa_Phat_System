import type { Metadata } from "next";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import ToastProvider from "@/components/ToastProvider";

export const metadata: Metadata = {
  title: "Gia Hòa Phát - Nguyên liệu & Thiết bị làm bánh",
  description:
    "Hệ thống thương mại điện tử chuyên cung cấp nguyên liệu và thiết bị làm bánh chất lượng cao.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SessionProvider>
          {children}
          <ToastProvider />
        </SessionProvider>
      </body>
    </html>
  );
}
