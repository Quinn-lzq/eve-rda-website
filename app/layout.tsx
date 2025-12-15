// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css"; // 确保这一行还在！

export const metadata: Metadata = {
  title: "EVE RDA System",
  description: "Resource Development & Audit System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* 移除 Inter 字体，直接使用系统默认 sans-serif */}
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}