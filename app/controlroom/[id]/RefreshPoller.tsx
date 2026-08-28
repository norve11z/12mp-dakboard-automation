"use client";

import { useEffect } from "react";

export default function RefreshPoller() {
  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch("/api/next-refresh", {
          cache: "no-store",
        });

        if (!res.ok || cancelled) return;

        const { next } = await res.json();

        if (cancelled || !next) return;

        // The API only returns a refresh that is actually due.
        window.location.reload();
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
