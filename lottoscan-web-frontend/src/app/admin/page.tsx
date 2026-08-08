"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, isAdmin } = useAuth();
  const router = useRouter();

  if (isAdmin) {
    router.push("/admin/dashboard");
    return null;
  }

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const user = await login(email, password);
      if (user.role !== "admin") {
        setError("You do not have admin access");
        return;
      }
      router.push("/admin/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-brand-section relative pt-16">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div className="w-[500px] h-[500px] rounded-full bg-gold/5 blur-[120px]" />
      </div>

      <div className="w-full max-w-[440px] relative bg-white border border-border-default rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.06)] overflow-hidden">
        {/* Gold top stripe */}
        <div className="h-1.5 bg-gold w-full" />

        <div className="p-8 md:p-10 space-y-8">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-gold-light border border-gold-border flex items-center justify-center text-3xl mx-auto shadow-sm">
              🔐
            </div>
            <h1 className="text-2xl font-display font-extrabold text-text-primary mt-4">
              Admin Access
            </h1>
            <p className="text-text-secondary font-body text-sm">
              Sign in to manage lottery results
            </p>
          </div>

          {error && (
            <div className="bg-lose-light border border-red-200 rounded-2xl p-4 animate-slide-up">
              <p className="text-lose text-sm font-body text-center font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-text-secondary text-xs font-body uppercase font-bold tracking-wider mb-2 block">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@lottoscan.lk"
                className="input-dark text-sm w-full"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
            <div>
              <label className="text-text-secondary text-xs font-body uppercase font-bold tracking-wider mb-2 block">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-dark text-sm w-full"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
          </div>

          <div className="pt-2">
            <Button onClick={handleLogin} loading={loading} fullWidth size="lg">
              Sign In
            </Button>
          </div>

          <p className="text-text-muted text-xs font-body text-center hover:text-text-secondary transition-colors cursor-pointer hover:underline">
            Forgot password? Contact system administrator
          </p>
        </div>
      </div>
    </div>
  );
}
