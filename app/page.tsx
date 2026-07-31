"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/admin";
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr("");
    const r = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setBusy(false);
    if (!r.ok) { setErr("Invalid password"); return; }
    router.push(next);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
      <form onSubmit={submit} className="bg-gray-900 border border-gray-800 rounded-lg p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Control Room</h1>
        <label className="block mb-4">
          <span className="text-sm text-gray-400">Password</span>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoFocus
            className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
          />
        </label>
        {err && <div className="text-red-400 text-sm mb-3">{err}</div>}
        <button
          type="submit"
          disabled={busy || !password}
          className="w-full py-2 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 font-medium"
        >
          {busy ? "…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}