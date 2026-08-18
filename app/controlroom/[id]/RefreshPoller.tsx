"use client";

import { useEffect, useRef } from "react";

export default function RefreshPoller() {
  const lastSeenRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch("/api/next-refresh", { cache: "no-store" });
        if (!res.ok) return;
        const { next } = await res.json();
        if (cancelled || !next) return;

        const switchAt = new Date(next).getTime();
        const now = Date.now();

        // If the switch time has passed and we haven't already reloaded for it, reload.
        if (switchAt <= now && lastSeenRef.current !== next) {
          lastSeenRef.current = next;
          window.location.reload();
        }
      } catch {
        // ignore
      }
    }

    check();
    const id = setInterval(check, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return null;
}