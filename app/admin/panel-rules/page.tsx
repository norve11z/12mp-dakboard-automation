"use client";
import { useEffect, useState } from "react";

const SPORTS = ["Football", "Baseball", "Softball", "Men's Basketball", "Women's Basketball", "Volleyball", "Soccer"];
const TYPES = ["bigscreen", "broadcast"];

interface Rule {
  id: number;
  name: string;
  sports_key: string;
  priority: number;
  panel_1: string | null;
  panel_2: string | null;
  panel_3: string | null;
  panel_4: string | null;
}

function slotOptions(activeSports: string[]) {
  const opts: { value: string; label: string }[] = [
    { value: "", label: "— empty —" },
    { value: "default", label: "Default (no game)" },
  ];
  for (const s of activeSports) {
    for (const t of TYPES) {
      opts.push({ value: `${s}:${t}`, label: `${s} ${t === "bigscreen" ? "Big Screen" : "Broadcast"}` });
    }
  }
  return opts;
}

export default function PanelRulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [activeSports, setActiveSports] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [priority, setPriority] = useState(100);
  const [panels, setPanels] = useState<[string, string, string, string]>(["", "", "", ""]);

  const load = () => fetch("/api/panel-combo-rules").then(r => r.json()).then(setRules);
  useEffect(() => { load(); }, []);

  const sportsKey = [...activeSports].sort().join(",");
  const slots = slotOptions(activeSports);

  const toggleSport = (s: string) =>
    setActiveSports(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const save = async (id?: number) => {
    if (!name || !sportsKey) { alert("Name + at least one sport required"); return; }
    await fetch("/api/panel-combo-rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id, name, sports_key: sportsKey, priority,
        panel_1: panels[0], panel_2: panels[1], panel_3: panels[2], panel_4: panels[3],
      }),
    });
    setName(""); setPriority(100); setActiveSports([]); setPanels(["", "", "", ""]);
    load();
  };

  const edit = (r: Rule) => {
    setName(r.name);
    setPriority(r.priority);
    setActiveSports(r.sports_key.split(",").filter(Boolean));
    setPanels([r.panel_1 || "", r.panel_2 || "", r.panel_3 || "", r.panel_4 || ""]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const del = async (id: number) => {
    if (!confirm("Delete this rule?")) return;
    await fetch("/api/panel-combo-rules", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Panel Auto-Assign Rules</h1>
      <p className="text-gray-400 text-sm mb-6">
        Define which games/displays go on which panels when a specific combination of sports is happening that day.
        Match is based on the exact set of sports with displays on the date.
      </p>

      <div className="bg-gray-900 border border-gray-800 rounded p-4 mb-6 space-y-4">
        <div className="flex gap-3 items-end flex-wrap">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-gray-400">Rule name</span>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Football only"
              className="bg-gray-800 px-2 py-1 rounded w-64" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-gray-400">Priority</span>
            <input type="number" value={priority}
              onChange={e => setPriority(Number(e.target.value))}
              className="bg-gray-800 px-2 py-1 rounded w-20" />
          </label>
          <div className="text-xs text-gray-500">Lower number = tried first</div>
        </div>

        <div>
          <div className="text-sm text-gray-400 mb-1">Active sports (which sports have displays that day):</div>
          <div className="flex flex-wrap gap-2">
            {SPORTS.map(s => (
              <button key={s} onClick={() => toggleSport(s)}
                className={`px-3 py-1 rounded text-sm border ${
                  activeSports.includes(s)
                    ? "bg-blue-700 border-blue-500"
                    : "bg-gray-800 border-gray-700 text-gray-400"
                }`}>
                {s}
              </button>
            ))}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            sports_key: <code>{sportsKey || "(none)"}</code>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map(i => (
            <label key={i} className="flex flex-col gap-1 text-sm">
              <span className="text-gray-400">Panel {i + 1}</span>
              <select value={panels[i]}
                onChange={e => {
                  const next = [...panels] as typeof panels;
                  next[i] = e.target.value;
                  setPanels(next);
                }}
                className="bg-gray-800 px-2 py-1 rounded">
                {slots.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
          ))}
        </div>

        <div className="flex justify-end">
          <button onClick={() => save()}
            className="px-4 py-2 bg-green-600 rounded hover:bg-green-700">
            Save rule
          </button>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-3">Existing rules</h2>
      <table className="w-full bg-gray-900 border border-gray-800 rounded overflow-hidden text-sm">
        <thead className="bg-gray-800 text-left">
          <tr>
            <th className="p-2 w-12">Prio</th>
            <th className="p-2">Name</th>
            <th className="p-2">Sports</th>
            <th className="p-2">P1</th>
            <th className="p-2">P2</th>
            <th className="p-2">P3</th>
            <th className="p-2">P4</th>
            <th className="p-2 w-24"></th>
          </tr>
        </thead>
        <tbody>
          {rules.map(r => (
            <tr key={r.id} className="border-t border-gray-800">
              <td className="p-2 text-gray-500">{r.priority}</td>
              <td className="p-2 font-medium">{r.name}</td>
              <td className="p-2 text-xs font-mono text-gray-400">{r.sports_key}</td>
              <td className="p-2 text-xs">{r.panel_1 || "—"}</td>
              <td className="p-2 text-xs">{r.panel_2 || "—"}</td>
              <td className="p-2 text-xs">{r.panel_3 || "—"}</td>
              <td className="p-2 text-xs">{r.panel_4 || "—"}</td>
              <td className="p-2 flex gap-1">
                <button onClick={() => edit(r)} className="text-xs px-2 py-0.5 bg-blue-700 rounded hover:bg-blue-600">Edit</button>
                <button onClick={() => del(r.id)} className="text-xs px-2 py-0.5 bg-red-700 rounded hover:bg-red-600">✕</button>
              </td>
            </tr>
          ))}
          {rules.length === 0 && (
            <tr><td colSpan={8} className="p-3 text-center text-gray-500">No rules yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}