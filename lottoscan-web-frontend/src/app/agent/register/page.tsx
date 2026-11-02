"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth as authApi } from "@/lib/api";
import Button from "@/components/ui/Button";

export default function AgentRegisterPage() {
  const [form, setForm] = useState({
    agencyName: "",
    boardAffiliation: "BOTH",
    nlbCode: "",
    dlbCode: "",
    email: "",
    phone: "",
    location: "Pettah Central, Colombo",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.agencyName.trim() || !form.email.trim() || !form.password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (form.boardAffiliation === "BOTH") {
      if (!form.nlbCode.trim() || !form.dlbCode.trim()) {
        setError("Dual dealers must provide both NLB and DLB dealer codes separately.");
        return;
      }
    } else if (form.boardAffiliation === "NLB") {
      if (!form.nlbCode.trim()) {
        setError("Please enter your NLB Dealer / License Code.");
        return;
      }
    } else if (form.boardAffiliation === "DLB") {
      if (!form.dlbCode.trim()) {
        setError("Please enter your DLB Dealer / License Code.");
        return;
      }
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const primaryCode = form.boardAffiliation === "DLB" ? form.dlbCode.trim() : form.nlbCode.trim();
      const res = await authApi.agentRegister({
        email: form.email.trim(),
        password: form.password,
        agencyName: form.agencyName.trim(),
        agentCode: primaryCode,
        nlbId: form.boardAffiliation !== "DLB" ? form.nlbCode.trim().toUpperCase() : "",
        dlbId: form.boardAffiliation !== "NLB" ? form.dlbCode.trim().toUpperCase() : "",
        phone: form.phone.trim(),
        boardAffiliation: form.boardAffiliation,
        location: form.location.trim(),
      });
      const { token, user } = res.data;
      localStorage.setItem("lottoscan_token", token);
      localStorage.setItem("lottoscan_user", JSON.stringify(user));
      router.push("/agent/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative pt-24 pb-16 overflow-hidden bg-slate-950">
      {/* Background image & gradient overlays */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero-background.jpg"
          alt="LottoScan Agency Registration Background"
          fill
          priority
          quality={95}
          className="object-cover object-center select-none pointer-events-none opacity-45 dark:opacity-55 scale-105"
        />
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[3px] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-transparent to-slate-950 pointer-events-none" />
      </div>

      <div className="w-full max-w-[560px] relative z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/20 dark:border-slate-800 rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.35)] overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-amber-500 via-gold to-blue-600 w-full" />

        <div className="p-8 md:p-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border-2 border-gold flex items-center justify-center text-2xl mx-auto shadow-sm">
              📝
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              <span className="text-[10px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800/80">
                Dealer Onboarding
              </span>
            </div>
            <h1 className="text-2xl font-display font-extrabold text-slate-900 dark:text-white">
              Register Lottery Agency
            </h1>
            <p className="text-slate-600 dark:text-slate-400 font-body text-xs">
              Set up your authorized dealer profile for counter tracking and payout reconciliation
            </p>
          </div>

          {error && (
            <div className="bg-lose-light border border-red-200 rounded-xl p-3 animate-slide-up">
              <p className="text-lose text-xs font-body text-center font-bold">{error}</p>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4 text-xs font-body">
            {/* Row 1: Agency Name and Board Affiliation (selected FIRST) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider text-[11px]">
                  Agency Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ruwan Lottery Agency"
                  value={form.agencyName}
                  onChange={(e) => setForm({ ...form, agencyName: e.target.value })}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:outline-none focus:border-gold transition-colors"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider text-[11px]">
                  Board Affiliation *
                </label>
                <select
                  value={form.boardAffiliation}
                  onChange={(e) => setForm({ ...form, boardAffiliation: e.target.value })}
                  className="w-full border border-amber-300 dark:border-amber-700/80 rounded-xl px-3.5 py-2.5 bg-amber-50/40 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:outline-none focus:border-gold transition-colors cursor-pointer"
                >
                  <option value="BOTH">Dual Dealer (NLB & DLB)</option>
                  <option value="NLB">National Lotteries Board (NLB)</option>
                  <option value="DLB">Development Lotteries Board (DLB)</option>
                </select>
              </div>
            </div>

            {/* Row 2: Dealer Codes (Dynamically requires separate NLB & DLB codes for dual dealer) */}
            {form.boardAffiliation === "BOTH" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 border border-amber-200/60 dark:border-amber-900/40">
                <div>
                  <label className="block font-bold text-blue-700 dark:text-blue-400 mb-1 uppercase tracking-wider text-[11px] flex items-center justify-between">
                    <span>NLB Dealer Code *</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded font-black border border-blue-300 dark:border-blue-800">
                      NLB
                    </span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NLB-AGN-782"
                    value={form.nlbCode}
                    onChange={(e) => setForm({ ...form, nlbCode: e.target.value })}
                    className="w-full border border-blue-200 dark:border-blue-900/60 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold uppercase text-xs focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-bold text-amber-700 dark:text-amber-400 mb-1 uppercase tracking-wider text-[11px] flex items-center justify-between">
                    <span>DLB Dealer Code *</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded font-black border border-amber-300 dark:border-amber-800">
                      DLB
                    </span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DLB-AGN-451"
                    value={form.dlbCode}
                    onChange={(e) => setForm({ ...form, dlbCode: e.target.value })}
                    className="w-full border border-amber-200 dark:border-amber-900/60 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold uppercase text-xs focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>
            ) : form.boardAffiliation === "NLB" ? (
              <div className="p-3 rounded-2xl bg-blue-50/50 dark:bg-slate-800/50 border border-blue-200/60 dark:border-blue-900/40">
                <label className="block font-bold text-blue-700 dark:text-blue-400 mb-1 uppercase tracking-wider text-[11px] flex items-center justify-between">
                  <span>NLB Dealer / License Code *</span>
                  <span className="text-[9px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded font-black border border-blue-300 dark:border-blue-800">
                    NLB Only
                  </span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NLB-AGN-782"
                  value={form.nlbCode}
                  onChange={(e) => setForm({ ...form, nlbCode: e.target.value })}
                  className="w-full border border-blue-200 dark:border-blue-900/60 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold uppercase text-xs focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-amber-50/50 dark:bg-slate-800/50 border border-amber-200/60 dark:border-amber-900/40">
                <label className="block font-bold text-amber-700 dark:text-amber-400 mb-1 uppercase tracking-wider text-[11px] flex items-center justify-between">
                  <span>DLB Dealer / License Code *</span>
                  <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded font-black border border-amber-300 dark:border-amber-800">
                    DLB Only
                  </span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DLB-AGN-451"
                  value={form.dlbCode}
                  onChange={(e) => setForm({ ...form, dlbCode: e.target.value })}
                  className="w-full border border-amber-200 dark:border-amber-900/60 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold uppercase text-xs focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            )}

            {/* Row 3: Official Email and Contact Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider text-[11px]">
                  Official Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="dealer@agency.lk"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:outline-none focus:border-gold transition-colors"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider text-[11px]">
                  Contact Phone
                </label>
                <input
                  type="text"
                  placeholder="+94 77 XXX XXXX"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:outline-none focus:border-gold transition-colors"
                />
              </div>
            </div>

            {/* Row 4: Location / City */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider text-[11px]">
                Location / City
              </label>
              <input
                type="text"
                placeholder="e.g. Pettah Central, Colombo"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:outline-none focus:border-gold transition-colors"
              />
            </div>

            {/* Row 5: Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider text-[11px]">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:outline-none focus:border-gold transition-colors"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider text-[11px]">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:outline-none focus:border-gold transition-colors"
                />
              </div>
            </div>

            <Button
              type="submit"
              fullWidth
              loading={loading}
              size="md"
              className="bg-gold text-slate-950 font-bold text-xs py-3 shadow-md hover:bg-gold-dark mt-4"
            >
              ✅ Complete Dealer Registration →
            </Button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-600 dark:text-slate-400">
            Already have an agency account?{" "}
            <Link href="/agent/login" className="text-amber-600 dark:text-amber-400 font-extrabold hover:underline">
              Sign In Here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
