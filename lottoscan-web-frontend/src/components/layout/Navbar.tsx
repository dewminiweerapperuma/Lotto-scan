"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/hooks";
import { useLanguage } from "@/context/LanguageContext";
import LanguageToggle from "@/components/ui/LanguageToggle";
import InstallButton from "@/components/pwa/InstallButton";

export default function Navbar() {
  const pathname = usePathname();
  const { user, isAdmin } = useAuth();
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  const NAV_LINKS = [
    { href: "/", label: t("nav_home") },
    { href: "/results", label: t("nav_results") },
    { href: "/check", label: t("nav_check") },
    { href: "/scan", label: "⚡ Bulk Scan" },
    { href: "/about", label: t("nav_about") },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#F3F4F6] shadow-sm h-16">
      <div className="container h-full">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-display font-extrabold text-xl">
            <span>🎫</span>
            <span>
              <span className="text-text-primary">Lotto</span>
              <span className="text-gold">Scan</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 h-full">
            {NAV_LINKS.map(link => {
              const isActive = pathname === link.href;
              return (
                <Link key={link.href} href={link.href}
                  className={`font-body text-sm font-semibold transition-colors flex items-center h-full border-b-2 ${isActive ? "text-gold border-gold" : "text-text-secondary border-transparent hover:text-text-primary"}`}>
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <InstallButton />
            <LanguageToggle />
            <a
              href="https://lklottery.com/pdf/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-display font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-3.5 py-2 rounded-[12px] transition-all hover:scale-105"
              title="Download Official PDF Results"
            >
              <span>📄</span>
              <span>{t("download_pdf")}</span>
            </a>
            <Link href={isAdmin ? "/admin/dashboard" : "/admin"}
              className="text-text-secondary hover:text-text-primary text-sm font-body transition-colors border border-border-default hover:border-border-hover hover:bg-brand-section px-4 py-2 rounded-[12px] font-medium">
              {isAdmin ? t("nav_dashboard") : t("nav_admin")}
            </Link>
            <Link href="/check"
              className="bg-gold text-white font-display font-semibold text-sm px-4 py-2 rounded-[12px] hover:bg-gold-dark hover:shadow-lg transition-all active:scale-95 shadow-md shadow-gold/30">
              {t("nav_check_btn")}
            </Link>
          </div>

          {/* Mobile Menu Button & Language Toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <LanguageToggle variant="compact" />
            <button onClick={() => setMenuOpen(!menuOpen)} className="text-text-secondary hover:text-text-primary p-1.5">
              {menuOpen ? (
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-b border-[#F3F4F6] shadow-lg py-4 px-4 space-y-2 absolute left-0 right-0 top-16">
            {NAV_LINKS.map(link => (
              <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-[12px] font-body text-sm font-medium transition-colors ${pathname === link.href ? "bg-gold-light/40 text-gold-dark" : "text-text-secondary hover:text-text-primary hover:bg-brand-section"}`}>
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-border-default space-y-2">
              <div className="flex justify-center pb-1">
                <InstallButton className="w-full justify-center py-2" />
              </div>
              <a
                href="https://lklottery.com/pdf/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-[12px] font-display text-sm font-bold text-red-600 bg-red-50 border border-red-200"
              >
                <span>📄</span>
                <span>{t("download_official_pdf")}</span>
              </a>
              <Link href={isAdmin ? "/admin/dashboard" : "/admin"} onClick={() => setMenuOpen(false)}
                className="block px-4 py-2.5 rounded-[12px] font-body text-sm text-text-secondary hover:text-text-primary hover:bg-brand-section font-medium">
                {isAdmin ? t("nav_dashboard") : t("nav_admin")}
              </Link>
              <Link href="/check" onClick={() => setMenuOpen(false)}
                className="block px-4 py-2.5 rounded-[12px] font-display text-sm bg-gold text-white font-semibold text-center shadow-md shadow-gold/30">
                {t("nav_check_btn")}
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
