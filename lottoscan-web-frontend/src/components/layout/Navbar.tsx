"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/hooks";
import { useLanguage } from "@/context/LanguageContext";
import LanguageToggle from "@/components/ui/LanguageToggle";
import {
  ChevronDown,
  Building2,
  ShieldCheck,
  LogOut,
  QrCode,
  FileText,
  Menu,
  X,
  Sparkles,
  Trophy,
  History
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const { user, isAdmin, isAgent, isSuperAdmin, logout } = useAuth();
  const { t } = useLanguage();

  // Dropdown states
  const [resultsOpen, setResultsOpen] = useState(false);
  const [portalOpen, setPortalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const resultsRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
        setResultsOpen(false);
      }
      if (portalRef.current && !portalRef.current.contains(event.target as Node)) {
        setPortalOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 h-20 transition-all print:hidden no-print">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 h-full">
        <div className="flex items-center justify-between h-full">

          {/* 1. Left: Minimalist Brand Logo (like Edulamp) */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-sm shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <QrCode className="w-5 h-5" />
            </div>
            <div className="flex items-baseline">
              <span className="font-display font-black text-2xl tracking-tight text-slate-900">
                Lotto
              </span>
              <span className="font-display font-black text-2xl tracking-tight text-amber-500">
                Scan
              </span>
            </div>
          </Link>

          {/* 2. Center: Clean Navigation Links with Chevrons (like Edulamp) */}
          <div className="hidden md:flex items-center gap-8 lg:gap-10">
            {/* Home */}
            <Link
              href="/"
              className={`text-sm font-semibold transition-colors flex items-center gap-1 ${
                pathname === "/"
                  ? "text-amber-600 font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>{t("nav_home")}</span>
            </Link>

            {/* Results Dropdown */}
            <div className="relative" ref={resultsRef}>
              <button
                onClick={() => setResultsOpen(!resultsOpen)}
                className={`text-sm font-semibold transition-colors flex items-center gap-1.5 py-2 ${
                  pathname.startsWith("/results")
                    ? "text-amber-600 font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>{t("nav_results")}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform text-slate-400 ${resultsOpen ? "rotate-180 text-amber-600" : ""}`} />
              </button>

              {resultsOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl p-2 space-y-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <Link
                    href="/results"
                    onClick={() => setResultsOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                  >
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span>Today's Live Results</span>
                  </Link>
                  <a
                    href="https://lklottery.com/pdf/"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setResultsOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-red-500" />
                    <span>Official PDF Sheets</span>
                  </a>
                </div>
              )}
            </div>

            {/* Check Ticket */}
            <Link
              href="/check"
              className={`text-sm font-semibold transition-colors flex items-center gap-1 ${
                pathname === "/check"
                  ? "text-amber-600 font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>{t("nav_check")}</span>
            </Link>

            {/* Bulk Scan */}
            <Link
              href="/scan"
              className={`text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                pathname === "/scan"
                  ? "text-amber-600 font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Bulk Scan</span>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            </Link>

            {/* About */}
            <Link
              href="/about"
              className={`text-sm font-semibold transition-colors flex items-center gap-1 ${
                pathname === "/about"
                  ? "text-amber-600 font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>{t("nav_about")}</span>
            </Link>
          </div>

          {/* 3. Right: Clean Login Text Link + Solid Pill CTA (like Edulamp) */}
          <div className="hidden md:flex items-center gap-5 shrink-0">
            {/* Discreet Language Segmented Switch */}
            <LanguageToggle variant="compact" />

            {/* Portal / Login Dropdown */}
            <div className="relative" ref={portalRef}>
              {isSuperAdmin ? (
                <button
                  onClick={() => setPortalOpen(!portalOpen)}
                  className="text-sm font-semibold text-slate-900 hover:text-amber-600 flex items-center gap-1.5 transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  <span>Super Admin</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
              ) : isAgent ? (
                <button
                  onClick={() => setPortalOpen(!portalOpen)}
                  className="text-sm font-semibold text-slate-900 hover:text-amber-600 flex items-center gap-1.5 transition-colors"
                >
                  <Building2 className="w-4 h-4 text-amber-600" />
                  <span>{user?.agentCode || "Agent"}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
              ) : (
                <button
                  onClick={() => setPortalOpen(!portalOpen)}
                  className="text-sm font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1 transition-colors px-2 py-1"
                >
                  <span>Login</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
              )}

              {portalOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-100 rounded-2xl shadow-xl p-2 space-y-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {isSuperAdmin ? (
                    <>
                      <Link
                        href="/super/dashboard"
                        onClick={() => setPortalOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4 text-amber-500" />
                        <span>Governance Hub</span>
                      </Link>
                      <Link
                        href="/agent/dashboard"
                        onClick={() => setPortalOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Building2 className="w-4 h-4 text-slate-500" />
                        <span>Agency View</span>
                      </Link>
                    </>
                  ) : isAgent ? (
                    <>
                      <Link
                        href="/agent/dashboard"
                        onClick={() => setPortalOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Building2 className="w-4 h-4 text-amber-500" />
                        <span>Agency Dashboard</span>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/agent/login"
                        onClick={() => setPortalOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Building2 className="w-4 h-4 text-amber-600" />
                        <span>Agent Login</span>
                      </Link>
                      <Link
                        href="/agent/login"
                        onClick={() => setPortalOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4 text-slate-800" />
                        <span>Super Admin Login</span>
                      </Link>
                    </>
                  )}

                  {(isSuperAdmin || isAgent || isAdmin) && (
                    <div className="pt-1 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setPortalOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Primary Solid Pill Button (like "Sign up" in Edulamp) */}
            <Link
              href="/check"
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-extrabold text-sm transition-all shadow-sm shadow-amber-500/20 hover:shadow-md hover:shadow-amber-500/30 hover:-translate-y-0.5 active:translate-y-0"
            >
              Check Ticket
            </Link>
          </div>

          {/* Mobile Right Controls: Language & Hamburger */}
          <div className="flex items-center gap-3 md:hidden">
            <LanguageToggle variant="compact" />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-100 shadow-xl py-4 px-4 space-y-3 absolute left-0 right-0 top-20 animate-in slide-in-from-top-2 duration-150">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 rounded-xl"
            >
              {t("nav_home")}
            </Link>
            <Link
              href="/results"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 rounded-xl"
            >
              {t("nav_results")}
            </Link>
            <Link
              href="/check"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 rounded-xl"
            >
              {t("nav_check")}
            </Link>
            <Link
              href="/scan"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 rounded-xl"
            >
              Bulk Scan ⚡
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 rounded-xl"
            >
              {t("nav_about")}
            </Link>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <Link
                href="/agent/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2.5 text-sm font-bold text-slate-700 bg-slate-50 rounded-xl"
              >
                Login
              </Link>
              <Link
                href="/check"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2.5 text-sm font-extrabold text-slate-950 bg-amber-500 rounded-xl"
              >
                Check Ticket
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
