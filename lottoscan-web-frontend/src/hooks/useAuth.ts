"use client";
import { useState, useEffect, useCallback } from "react";
import { auth as authApi } from "@/lib/api";

interface User { userId: string; email: string; role: string; }

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("lottoscan_user");
    const token = localStorage.getItem("lottoscan_token");
    if (stored && token) {
      try { setUser(JSON.parse(stored)); } catch { localStorage.removeItem("lottoscan_user"); }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    const { token, user: u } = res.data;
    localStorage.setItem("lottoscan_token", token);
    localStorage.setItem("lottoscan_user", JSON.stringify(u));
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("lottoscan_token");
    localStorage.removeItem("lottoscan_user");
    setUser(null);
  }, []);

  return { user, loading, login, logout, isAdmin: user?.role === "admin" };
}
