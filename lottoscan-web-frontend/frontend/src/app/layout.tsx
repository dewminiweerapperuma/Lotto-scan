import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LottoScan — Sri Lankan Lottery Checker",
  description: "Check your Sri Lankan lottery ticket instantly. Supports all NLB and DLB lotteries.",
  keywords: ["lottery", "Sri Lanka", "NLB", "DLB", "check ticket", "winning numbers"],
  manifest: "/manifest.json",
  themeColor: "#F5C518",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#0A0A0F] text-white antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
