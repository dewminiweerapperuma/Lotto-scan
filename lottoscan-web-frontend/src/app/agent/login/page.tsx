"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/hooks";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useLanguage } from "@/context/LanguageContext";
import LanguageToggle from "@/components/ui/LanguageToggle";

export default function AgentLoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, isAgent, isAdmin, isSuperAdmin } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    // If already actively logged in as an agent, route to agent dashboard
    if (isAgent) {
      router.push("/agent/dashboard");
    }
  }, [isAgent, router]);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!identifier || !password) {
      setError("Please provide your Email or Dealer Code, and Password.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const user = await login(identifier, password);
      if (user.role === "SUPER_ADMIN") {
        router.push("/super/dashboard");
      } else if (user.role === "agent" || user.role === "AREA_AGENT" || user.role === "admin") {
        router.push("/agent/dashboard");
      } else {
        setError("This portal is reserved for authorized lottery agents and administrators.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || "Login failed. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative pt-20 pb-16 overflow-hidden bg-slate-950">
      {/* Background photo & gradient overlays */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero-background.jpg"
          alt="LottoScan Agency Portal Background"
          fill
          priority
          quality={95}
          className="object-cover object-center select-none pointer-events-none opacity-45 dark:opacity-55 scale-105"
        />
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[3px] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-transparent to-slate-950 pointer-events-none" />
      </div>

      <div className="w-full max-w-[460px] relative z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/20 dark:border-slate-800 rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.35)] overflow-hidden">
        {/* Top Board Banner Strip */}
        <div className="h-2 bg-gradient-to-r from-amber-500 via-gold to-blue-600 w-full" />

        <div className="p-8 md:p-10 space-y-7">
          <div className="flex justify-end">
            <LanguageToggle variant="compact" />
          </div>

          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border-2 border-gold flex items-center justify-center text-3xl mx-auto shadow-sm">
              🏢
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              <span className="text-[10px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800/80">
                NLB & DLB Agency Portal
              </span>
            </div>
            <h1 className="text-2xl font-display font-extrabold text-slate-900 dark:text-white">
              {t("login_agent_title")}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 font-body text-xs">
              {t("login_agent_subtitle")}
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-lose-light border border-red-200 rounded-xl p-3.5 animate-slide-up">
              <p className="text-lose text-xs font-body text-center font-bold">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-slate-700 dark:text-slate-300 text-xs font-body uppercase font-bold tracking-wider mb-1.5 block">
                {t("login_dealer_code_label")}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. AGN-001 or agent@agency.lk"
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-gold"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-slate-700 dark:text-slate-300 text-xs font-body uppercase font-bold tracking-wider block">
                  {t("login_password_label")}
                </label>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-gold"
              />
            </div>

            <Button
              type="submit"
              fullWidth
              loading={loading}
              size="md"
              className="bg-gold text-slate-950 font-bold text-xs py-3 shadow-md hover:bg-gold-dark mt-2"
            >
              🔐 {t("login_signin_btn")} →
            </Button>
          </form>

          {/* Footer Links */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center space-y-2">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              New authorized lottery dealer?{" "}
              <Link href="/agent/register" className="text-amber-600 dark:text-amber-400 font-extrabold hover:underline">
                Register Agency
              </Link>
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Platform Admin?{" "}
              <Link href="/admin" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white underline">
                Switch to Admin Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
