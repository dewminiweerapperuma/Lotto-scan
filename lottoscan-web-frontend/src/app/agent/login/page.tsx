"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/hooks";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function AgentLoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, isAgent, isAdmin, isSuperAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isSuperAdmin) {
      router.push("/super/dashboard");
    } else if (isAgent || isAdmin) {
      router.push("/agent/dashboard");
    }
  }, [isAgent, isAdmin, isSuperAdmin, router]);

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

  const handleFillDemo = () => {
    setIdentifier("AGN-001");
    setPassword("Agent123!");
    setError("");
  };

  const handleFillSuperAdminDemo = () => {
    setIdentifier("superadmin@lottoscan.lk");
    setPassword("SuperAdmin123!");
    setError("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-brand-section relative pt-20 pb-16">
      {/* Background ambient gold aura */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div className="w-[500px] h-[500px] rounded-full bg-gold/10 blur-[130px]" />
      </div>

      <div className="w-full max-w-[460px] relative bg-white border border-border-default rounded-[28px] shadow-[0_12px_40px_rgba(0,0,0,0.08)] overflow-hidden">
        {/* Top Board Banner Strip */}
        <div className="h-2 bg-gradient-to-r from-amber-500 via-gold to-blue-600 w-full" />

        <div className="p-8 md:p-10 space-y-7">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-gold-light border-2 border-gold flex items-center justify-center text-3xl mx-auto shadow-sm">
              🏢
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              <span className="text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                NLB & DLB Agency Portal
              </span>
            </div>
            <h1 className="text-2xl font-display font-extrabold text-text-primary">
              Lottery Agent Sign-In
            </h1>
            <p className="text-text-secondary font-body text-xs">
              Access your counter sales, live ticket scans, staff indents, and payout reconciliation
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-lose-light border border-red-200 rounded-xl p-3.5 animate-slide-up">
              <p className="text-lose text-xs font-body text-center font-bold">{error}</p>
            </div>
          )}

          {/* Quick Demo Credentials Autofill Banner */}
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-extrabold text-amber-950 text-[11px]">Demo Agency Account</p>
                <p className="text-[10px] text-amber-800 font-mono mt-0.5 truncate">
                  Code: <strong>AGN-001</strong> • Pass: <strong>Agent123!</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={handleFillDemo}
                className="shrink-0 px-2.5 py-1 text-[11px] font-bold text-amber-900 bg-amber-200/80 hover:bg-amber-300 rounded-lg transition-colors border border-amber-300"
              >
                Fill Agent
              </button>
            </div>
            <div className="flex items-center justify-between gap-3 pt-1 border-t border-amber-200/60">
              <div className="min-w-0">
                <p className="font-extrabold text-slate-900 text-[11px]">Super Admin Portal</p>
                <p className="text-[10px] text-slate-700 font-mono mt-0.5 truncate">
                  Email: <strong>superadmin@lottoscan.lk</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={handleFillSuperAdminDemo}
                className="shrink-0 px-2.5 py-1 text-[11px] font-bold text-amber-950 bg-amber-300 hover:bg-amber-400 rounded-lg transition-colors border border-amber-400"
              >
                Fill Admin
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-text-secondary text-xs font-body uppercase font-bold tracking-wider mb-1.5 block">
                Email Address or Dealer Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. AGN-001 or agent@agency.lk"
                  className="w-full border border-border-default rounded-xl px-3.5 py-2.5 text-xs font-bold bg-brand-section text-text-primary focus:outline-none focus:border-gold"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-text-secondary text-xs font-body uppercase font-bold tracking-wider block">
                  Password
                </label>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-border-default rounded-xl px-3.5 py-2.5 text-xs font-bold bg-brand-section text-text-primary focus:outline-none focus:border-gold"
              />
            </div>

            <Button
              type="submit"
              fullWidth
              loading={loading}
              size="md"
              className="bg-gold text-white font-bold text-xs py-3 shadow-md hover:bg-gold-dark mt-2"
            >
              🔐 Sign In to Agency Portal →
            </Button>
          </form>

          {/* Footer Links */}
          <div className="pt-3 border-t border-border-default/60 text-center space-y-2">
            <p className="text-xs text-text-secondary">
              New authorized lottery dealer?{" "}
              <Link href="/agent/register" className="text-gold-dark font-extrabold hover:underline">
                Register Agency
              </Link>
            </p>
            <p className="text-[11px] text-text-muted">
              Platform Admin?{" "}
              <Link href="/admin" className="text-text-secondary hover:text-text-primary underline">
                Switch to Admin Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
