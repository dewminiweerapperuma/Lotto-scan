"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth as authApi } from "@/lib/api";
import Button from "@/components/ui/Button";

export default function AgentRegisterPage() {
  const [form, setForm] = useState({
    agencyName: "",
    agentCode: "",
    email: "",
    phone: "",
    boardAffiliation: "BOTH",
    location: "Pettah Central, Colombo",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.agencyName || !form.email || !form.password) {
      setError("Please fill in all required fields.");
      return;
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
      const res = await authApi.agentRegister({
        email: form.email,
        password: form.password,
        agencyName: form.agencyName,
        agentCode: form.agentCode,
        phone: form.phone,
        boardAffiliation: form.boardAffiliation,
        location: form.location,
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
    <div className="min-h-screen flex items-center justify-center px-4 bg-brand-section relative pt-20 pb-16">
      <div className="w-full max-w-[540px] relative bg-white border border-border-default rounded-[28px] shadow-[0_12px_40px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-amber-500 via-gold to-blue-600 w-full" />

        <div className="p-8 md:p-10 space-y-6">
          <div className="text-center space-y-1.5">
            <div className="w-14 h-14 rounded-2xl bg-gold-light border-2 border-gold flex items-center justify-center text-2xl mx-auto">
              📝
            </div>
            <h1 className="text-2xl font-display font-extrabold text-text-primary">
              Register Lottery Agency
            </h1>
            <p className="text-text-secondary font-body text-xs">
              Set up your authorized dealer profile for counter tracking and payout reconciliation
            </p>
          </div>

          {error && (
            <div className="bg-lose-light border border-red-200 rounded-xl p-3 animate-slide-up">
              <p className="text-lose text-xs font-body text-center font-bold">{error}</p>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4 text-xs font-body">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-text-secondary mb-1 uppercase tracking-wider text-[11px]">
                  Agency Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ruwan Lottery Agency"
                  value={form.agencyName}
                  onChange={(e) => setForm({ ...form, agencyName: e.target.value })}
                  className="w-full border border-border-default rounded-xl px-3 py-2 bg-brand-section text-text-primary font-bold focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block font-bold text-text-secondary mb-1 uppercase tracking-wider text-[11px]">
                  Dealer / License Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NLB-AGN-782"
                  value={form.agentCode}
                  onChange={(e) => setForm({ ...form, agentCode: e.target.value })}
                  className="w-full border border-border-default rounded-xl px-3 py-2 bg-brand-section text-text-primary font-bold uppercase focus:outline-none focus:border-gold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-text-secondary mb-1 uppercase tracking-wider text-[11px]">
                  Official Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="dealer@agency.lk"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-border-default rounded-xl px-3 py-2 bg-brand-section text-text-primary font-bold focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block font-bold text-text-secondary mb-1 uppercase tracking-wider text-[11px]">
                  Contact Phone
                </label>
                <input
                  type="text"
                  placeholder="+94 77 XXX XXXX"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-border-default rounded-xl px-3 py-2 bg-brand-section text-text-primary focus:outline-none focus:border-gold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-text-secondary mb-1 uppercase tracking-wider text-[11px]">
                  Board Affiliation
                </label>
                <select
                  value={form.boardAffiliation}
                  onChange={(e) => setForm({ ...form, boardAffiliation: e.target.value })}
                  className="w-full border border-border-default rounded-xl px-3 py-2 bg-brand-section text-text-primary font-bold focus:outline-none focus:border-gold"
                >
                  <option value="BOTH">Dual Dealer (NLB & DLB)</option>
                  <option value="NLB">National Lotteries Board (NLB)</option>
                  <option value="DLB">Development Lotteries Board (DLB)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-text-secondary mb-1 uppercase tracking-wider text-[11px]">
                  Location / City
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kandy Clock Tower"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full border border-border-default rounded-xl px-3 py-2 bg-brand-section text-text-primary focus:outline-none focus:border-gold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-text-secondary mb-1 uppercase tracking-wider text-[11px]">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-border-default rounded-xl px-3 py-2 bg-brand-section text-text-primary focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block font-bold text-text-secondary mb-1 uppercase tracking-wider text-[11px]">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="w-full border border-border-default rounded-xl px-3 py-2 bg-brand-section text-text-primary focus:outline-none focus:border-gold"
                />
              </div>
            </div>

            <Button
              type="submit"
              fullWidth
              loading={loading}
              size="md"
              className="bg-gold text-white font-bold text-xs py-3 shadow-md hover:bg-gold-dark mt-4"
            >
              ✅ Complete Dealer Registration →
            </Button>
          </form>

          <div className="pt-2 text-center text-xs text-text-secondary">
            Already have an agency account?{" "}
            <Link href="/agent/login" className="text-gold-dark font-extrabold hover:underline">
              Sign In Here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
