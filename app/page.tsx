"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a]" />}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/admin";

  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    setBusy(true);
    setErr("");

    const r = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setBusy(false);

    if (!r.ok) {
      setErr("Invalid password");
      return;
    }

    router.push(next);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e7e5e2] flex items-center justify-center relative overflow-hidden">
      {/* A&M background accents */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#500000]" />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#500000]" />

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-[#1a0b0b] opacity-40" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full border border-[#1a0b0b] opacity-40" />
      </div>

      <div className="relative w-full max-w-md px-6">
        {/* Branding */}
        <div className="text-center mb-7">
          <div className="amdb-mono text-[10px] font-bold tracking-[0.35em] text-[#6b6b70] uppercase mb-2">
            Texas A&M Athletics
          </div>

          <div className="amdb-display text-3xl font-semibold tracking-tight text-[#e7e5e2]">
            12th Man Productions
          </div>

          <div className="amdb-mono text-[10px] uppercase tracking-[0.3em] text-[#500000] mt-2">
            Panel Automation Manager
          </div>
        </div>

        {/* Login card */}
        <form
          onSubmit={submit}
          className="
            bg-[#111113]
            border border-[#232326]
            rounded-sm
            overflow-hidden
          "
        >
          {/* Card header */}
          <div className="px-6 py-3 bg-[#18181b] border-b border-[#232326] flex items-center justify-between">
            <div className="amdb-mono text-[10px] uppercase tracking-[0.25em] text-[#6b6b70]">
              System Access
            </div>

            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4a9d5f]" />
              <span className="amdb-mono text-[9px] uppercase tracking-widest text-[#47474d]">
                Online
              </span>
            </div>
          </div>

          <div className="p-6">
            <h1 className="amdb-display text-xl font-semibold text-[#d8d6d3] mb-1">
              Sign in
            </h1>

            <p className="amdb-mono text-[10px] text-[#6b6b70] mb-6">
              Enter the administrator password to continue.
            </p>

            <label className="block">
              <span className="amdb-mono text-[10px] uppercase tracking-widest text-[#6b6b70]">
                Password
              </span>

              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoFocus
                className="
                  mt-2
                  w-full
                  bg-[#0a0a0a]
                  border border-[#2c2c30]
                  rounded-sm
                  px-3 py-2.5
                  text-sm
                  text-[#e7e5e2]
                  focus:outline-none
                  focus:border-[#7a1f1f]
                  transition
                "
              />
            </label>

            {err && (
              <div className="mt-3 px-3 py-2 bg-[#300000] border border-[#500000] rounded-sm">
                <div className="amdb-mono text-[10px] uppercase tracking-wide text-[#c96060]">
                  {err}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={busy || !password}
              className="
                mt-5
                w-full
                py-2.5
                bg-[#500000]
                border border-[#6b1616]
                rounded-sm
                hover:bg-[#681010]
                disabled:opacity-40
                disabled:hover:bg-[#500000]
                text-[#f0eeee]
                amdb-mono
                text-xs
                uppercase
                tracking-[0.15em]
                transition
              "
            >
              {busy ? "Authenticating…" : "Sign in"}
            </button>
          </div>

          {/* Card footer */}
          <div className="px-6 py-2.5 bg-[#0d0d0f] border-t border-[#232326]">
            <div className="amdb-mono text-[8px] uppercase tracking-[0.2em] text-[#3f3f44] text-center">
              Authorized Personnel Only
            </div>
          </div>
        </form>

        <div className="mt-4 text-center">
          <div className="amdb-mono text-[8px] uppercase tracking-[0.2em] text-[#3f3f44]">
            12th Man Productions · Panel Automation
          </div>
        </div>
      </div>
    </div>
  );
}