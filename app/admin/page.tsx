"use client";
import { useEffect, useState } from "react";

export default function AdminDashboard() {
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string>("");
  const [override, setOverride] = useState<string>("");
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  const loadOverride = async () => {
    const res = await fetch("/api/settings/display-date");
    const data = await res.json();
    setOverride(data.display_date_override || "");
  };

  const loadDates = async () => {
    const res = await fetch("/api/displays");
    const data = await res.json();
    const dates = Array.from(new Set(data.map((d: { game_date: string }) => d.game_date))).sort() as string[];
    setAvailableDates(dates);
  };

  useEffect(() => { loadOverride(); loadDates(); }, []);

  const saveOverride = async (date: string) => {
    await fetch("/api/settings/display-date", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: date || null }),
    });
    setOverride(date);
  };

  const run = async (label: string, url: string, method = "POST") => {
    setBusy(label);
    setMsg("");
    try {
      const res = await fetch(url, { method });
      const data = await res.json();
      setMsg(`${label}: ${JSON.stringify(data)}`);
    } catch (e) {
      setMsg(`${label} failed: ${String(e)}`);
    }
    setBusy(null);
    await loadDates();
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="flex gap-3 mb-6">
        <button disabled={busy !== null} onClick={() => run("Import ICS", "/api/import")}
          className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50">
          {busy === "Import ICS" ? "Importing…" : "Import ICS"}
        </button>
        <button disabled={busy !== null} onClick={() => run("Rebuild", "/api/rebuild")}
          className="px-4 py-2 bg-green-600 rounded hover:bg-green-700 disabled:opacity-50">
          Rebuild & Auto-Assign
        </button>
        <button disabled={busy !== null} onClick={() => run("Seed", "/api/seed")}
          className="px-4 py-2 bg-purple-600 rounded hover:bg-purple-700 disabled:opacity-50">
          Seed Test Data
        </button>
      </div>

      {msg && <pre className="bg-gray-900 p-3 rounded mb-6 text-sm overflow-x-auto">{msg}</pre>}

      <div className="bg-gray-900 rounded p-4 mb-8 border border-gray-800">
        <h2 className="text-xl font-bold mb-3">Display Date Override</h2>
        <p className="text-sm text-gray-400 mb-3">
          Panels normally show today&apos;s assignments. Set a date here to force all panels to show that date instead. Clear to return to today.
        </p>
        <div className="flex items-center gap-3">
          <select
            value={override}
            onChange={e => saveOverride(e.target.value)}
            className="bg-gray-800 px-3 py-2 rounded"
          >
            <option value="">Today (auto)</option>
            {availableDates.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <input
            type="date"
            value={override}
            onChange={e => saveOverride(e.target.value)}
            className="bg-gray-800 px-3 py-2 rounded"
          />
          {override && (
            <button
              onClick={() => saveOverride("")}
              className="px-3 py-2 bg-red-700 rounded hover:bg-red-800"
            >
              Clear
            </button>
          )}
          <span className="text-gray-400 text-sm ml-2">
            Currently: <strong className="text-white">{override || "today"}</strong>
          </span>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-4">Panel Previews</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(p => (
          <div key={p} className="bg-gray-900 rounded overflow-hidden border border-gray-800">
            <div className="px-3 py-2 bg-gray-800 font-bold flex justify-between items-center">
              <span>Panel {p}</span>
              <a href={`/controlroom/${p}`} target="_blank" className="text-xs text-blue-400 hover:underline">Open ↗</a>
            </div>
            <iframe
              src={`/controlroom/${p}`}
              className="w-full bg-black"
              style={{ height: 480, transform: "scale(0.25)", transformOrigin: "top left", width: 1080, marginBottom: -1440 }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}