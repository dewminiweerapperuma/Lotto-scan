import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";
import { LanguageProvider } from "@/context/LanguageContext";
import PWARegistration from "@/components/pwa/PWARegistration";

export const viewport = {
  themeColor: "#0F172A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "LottoScan — Sri Lanka Lottery Checker & Bulk Scanner",
  description: "Check Sri Lankan lottery tickets instantly. Fast continuous camera barcode scanner, automated result auditing for all NLB & DLB lotteries.",
  keywords: ["lottery", "Sri Lanka", "NLB", "DLB", "lottery checker", "winning numbers", "barcode scanner", "Govisetha", "Mahajana Sampatha"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LottoScan",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600&family=JetBrains+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <LanguageProvider>
          <AppShell>{children}</AppShell>
          <PWARegistration />
        </LanguageProvider>
      </body>
    </html>
  );
}
