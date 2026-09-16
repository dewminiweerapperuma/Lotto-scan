"use client";

import { useEffect, useState } from "react";

export default function PWARegistration() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            // Check for updates
            reg.addEventListener("updatefound", () => {
              const newWorker = reg.installing;
              if (newWorker) {
                newWorker.addEventListener("statechange", () => {
                  if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                    console.log("PWA: New version available. Refresh to update.");
                  }
                });
              }
            });
          })
          .catch((err) => {
            console.warn("PWA ServiceWorker registration notice:", err);
          });
      });
    }

    // 2. Online / Offline Status Listeners
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-amber-950/95 text-amber-200 border border-amber-500/40 px-4 py-2 rounded-full shadow-2xl backdrop-blur-md text-xs font-bold font-body flex items-center gap-2.5 animate-bounce">
      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
      <span>⚡ Offline Mode Active — Using cached lottery data</span>
    </div>
  );
}
