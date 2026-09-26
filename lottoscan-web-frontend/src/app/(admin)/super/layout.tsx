"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks";
import {
  LayoutDashboard,
  Building2,
  Trophy,
  RefreshCw,
  ShieldAlert,
  History,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Menu,
  X,
  ExternalLink
} from "lucide-react";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isSuperAdmin, logout, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !isSuperAdmin) {
      router.push("/agent/login");
    }
  }, [loading, isSuperAdmin, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-widest font-mono text-amber-400/80">
            Authenticating Super Governance Token...
          </p>
        </div>
      </div>
    );
  }

  const navItems = [
    {
      label: "National Dashboard",
      href: "/super/dashboard",
      icon: LayoutDashboard,
      badge: "LIVE",
    },
    {
      label: "Area Agencies",
      href: "/super/agents",
      icon: Building2,
    },
    {
      label: "Draws & Overrides",
      href: "/super/draws",
      icon: Trophy,
    },
    {
      label: "Crawler & Scrapers",
      href: "/super/scrapers",
      icon: RefreshCw,
    },
    {
      label: "Duplicate Claims",
      href: "/super/claims",
      icon: ShieldAlert,
      badge: "SECURITY",
    },
    {
      label: "Audit Logs",
      href: "/super/logs",
      icon: History,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased selection:bg-amber-500/30 selection:text-amber-200">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3.5 bg-slate-900/90 border-b border-slate-800/80 sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5">
              LottoScan <span className="text-[10px] text-amber-400 bg-amber-400/10 border border-amber-400/30 px-1.5 py-0.5 rounded font-mono">SUPER</span>
            </h1>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-slate-800/60 text-slate-300 hover:text-white border border-slate-700/50"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-72 bg-slate-900/70 border-r border-slate-800/80 flex flex-col justify-between z-40 backdrop-blur-xl transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Logo & System Badge */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-display font-extrabold text-lg text-white leading-none">
                  LottoScan
                </h2>
                <p className="text-[11px] font-mono text-amber-400/90 tracking-wider uppercase mt-1">
                  Governance Hub
                </p>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-[11px] text-amber-300/80 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Cluster: Production Sri Lanka
              </span>
              <span className="font-mono text-[10px] text-slate-400">v2.4</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <p className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400 px-3 pb-2">
              Subsystems
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? "bg-amber-400/10 text-amber-300 border border-amber-400/30 shadow-sm shadow-amber-400/5"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? "text-amber-400" : "text-slate-500 group-hover:text-slate-300"
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {item.badge && (
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold ${
                          item.badge === "SECURITY"
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight
                      className={`w-3.5 h-3.5 transition-transform opacity-0 group-hover:opacity-100 ${
                        isActive ? "opacity-100 text-amber-400" : "text-slate-500"
                      }`}
                    />
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer: User profile and actions */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 font-bold text-xs">
              SA
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-200 truncate">
                {user?.email || "superadmin@lottoscan.lk"}
              </p>
              <p className="text-[10px] text-amber-400/80 font-mono tracking-wide">
                SUPER_ADMIN (Full Access)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Link
              href="/agent/dashboard"
              className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-400 hover:text-slate-200 py-2 px-2 rounded-lg bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800 transition-colors"
            >
              <span>Agency View</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
            <button
              onClick={() => logout()}
              className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-rose-400 hover:text-rose-300 py-2 px-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
            >
              <LogOut className="w-3 h-3" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {/* Top bar with quick breadcrumb / state */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">LottoScan Governance</span>
            <span className="text-slate-600">/</span>
            <span className="text-amber-400 font-medium capitalize">
              {pathname.split("/").pop() || "Dashboard"}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/60">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-slate-300 font-mono text-[11px]">NLB & DLB Wire: Connected</span>
            </div>
            <Link
              href="/"
              className="text-slate-400 hover:text-amber-300 transition-colors text-[11px] font-medium flex items-center gap-1"
            >
              <span>Public Portal</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}
