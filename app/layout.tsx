import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "iPAS AI 應用規劃師模擬考",
  description: "提供學員正式模擬考、交卷評分與完整解答檢討。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
