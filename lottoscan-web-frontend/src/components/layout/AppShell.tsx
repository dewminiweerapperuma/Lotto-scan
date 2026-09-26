"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isSuperAdminRoute = pathname?.startsWith("/super");
  const isAgentAppRoute =
    pathname?.startsWith("/agent/dashboard") ||
    pathname?.startsWith("/agent/reports") ||
    pathname?.startsWith("/admin/dashboard") ||
    pathname?.startsWith("/admin/reports");

  if (isSuperAdminRoute) {
    return <div className="min-h-screen bg-slate-950">{children}</div>;
  }

  return (
    <>
      <Navbar />
      <main className="pt-20">{children}</main>
      {!isAgentAppRoute && <Footer />}
    </>
  );
}
