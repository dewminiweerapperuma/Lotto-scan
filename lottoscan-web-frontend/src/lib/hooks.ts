"use client";
import { useState, useEffect, useCallback } from "react";
import { auth as authApi } from "./api";

export interface User {
  id?: string;
  userId?: string;
  email: string;
  role: "SUPER_ADMIN" | "AREA_AGENT" | "COUNTER_STAFF" | "admin" | "agent" | "user";
  agencyName?: string;
  agentCode?: string;
  phone?: string;
  boardAffiliation?: "NLB" | "DLB" | "BOTH";
  location?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("lottoscan_user");
    const token = localStorage.getItem("lottoscan_token");
    if (stored && token) {
      try {
        const u = JSON.parse(stored);
        setUser(u);
        // Ensure cookies are kept in sync
        document.cookie = `lottoscan_role=${u.role || ""}; path=/; max-age=604800; SameSite=Lax`;
        document.cookie = `lottoscan_token=${token}; path=/; max-age=604800; SameSite=Lax`;
      } catch {
        localStorage.removeItem("lottoscan_user");
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (emailOrCode: string, password: string) => {
    const res = await authApi.login(emailOrCode, password);
    const { token, user: u } = res.data;
    localStorage.setItem("lottoscan_token", token);
    localStorage.setItem("lottoscan_user", JSON.stringify(u));
    document.cookie = `lottoscan_role=${u.role || ""}; path=/; max-age=604800; SameSite=Lax`;
    document.cookie = `lottoscan_token=${token}; path=/; max-age=604800; SameSite=Lax`;
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("lottoscan_token");
    localStorage.removeItem("lottoscan_user");
    document.cookie = "lottoscan_role=; path=/; max-age=0";
    document.cookie = "lottoscan_token=; path=/; max-age=0";
    setUser(null);
  }, []);

  return {
    user,
    loading,
    login,
    logout,
    isSuperAdmin: user?.role === "SUPER_ADMIN" || user?.role === "admin",
    isAdmin: user?.role === "admin" || user?.role === "SUPER_ADMIN" || user?.role === "AREA_AGENT" || user?.role === "agent",
    isAgent: user?.role === "agent" || user?.role === "AREA_AGENT",
    isAuth: !!user,
  };
}

export function useTicketResult() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("lottoscan_result");
    if (stored) { try { setResult(JSON.parse(stored)); } catch {} }
  }, []);

  const saveResult = useCallback((data: any) => {
    setResult(data);
    sessionStorage.setItem("lottoscan_result", JSON.stringify(data));
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    sessionStorage.removeItem("lottoscan_result");
  }, []);

  return { result, loading, error, setLoading, setError, saveResult, clearResult };
}
