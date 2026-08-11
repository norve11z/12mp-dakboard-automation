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
  <div className="min-h-screen bg-[#0a0a0a] text-[#e7e5e2] font-sans">
    <div className="h-1 w-full bg-[#500000]" />

    <div className="max-w-[1800px] mx-auto px-6 md:px-8 py-8">
      {/* Header */}
      <div className="mb-7">
        <div className="amdb-mono text-[10px] font-bold tracking-[0.3em] text-[#6b6b70] uppercase mb-1">
          Texas A&M Athletics
        </div>

        <h1 className="amdb-display text-3xl md:text-4xl font-semibold tracking-tight text-[#e7e5e2]">
          Panel Auto-Assign Rules
        </h1>

        <p className="amdb-mono text-xs text-[#6b6b70] mt-2 max-w-3xl leading-relaxed">
          Define which games/displays go on which panels when a specific
          combination of sports is happening that day. Match is based on the
          exact set of sports with displays on the date.
        </p>
      </div>

      {/* Rule editor */}
      <div className="bg-[#111113] border border-[#232326] rounded-sm p-4 mb-6 space-y-5">
        {/* Name / Priority */}
        <div className="flex gap-3 items-end flex-wrap">
          <label className="flex flex-col gap-1 text-xs">
            <span className="amdb-mono uppercase tracking-widest text-[#6b6b70]">
              Rule name
            </span>

            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Football only"
              className="
                amdb-mono
                bg-[#0a0a0a]
                border border-[#2c2c30]
                px-3 py-2
                rounded-sm
                w-64
                text-xs
                text-[#d8d6d3]
                placeholder:text-[#47474d]
                focus:outline-none
                focus:border-[#7a1f1f]
              "
            />
          </label>

          <label className="flex flex-col gap-1 text-xs">
            <span className="amdb-mono uppercase tracking-widest text-[#6b6b70]">
              Priority
            </span>

            <input
              type="number"
              value={priority}
              onChange={e => setPriority(Number(e.target.value))}
              className="
                amdb-mono
                bg-[#0a0a0a]
                border border-[#2c2c30]
                px-3 py-2
                rounded-sm
                w-20
                text-xs
                text-[#d8d6d3]
                focus:outline-none
                focus:border-[#7a1f1f]
              "
            />
          </label>

          <div className="amdb-mono text-[9px] uppercase tracking-widest text-[#47474d] pb-2">
            Lower number = tried first
          </div>
        </div>

        {/* Active sports */}
        <div>
          <div className="amdb-mono text-[10px] uppercase tracking-widest text-[#6b6b70] mb-2">
            Active sports
            <span className="ml-2 text-[#47474d]">
              — sports with displays that day
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {SPORTS.map(s => (
              <button
                key={s}
                onClick={() => toggleSport(s)}
                className={`
                  amdb-mono
                  px-3 py-1.5
                  rounded-sm
                  text-[10px]
                  uppercase
                  tracking-wide
                  border
                  transition
                  ${
                    activeSports.includes(s)
                      ? "bg-[#500000] border-[#7a1f1f] text-[#f0eeee]"
                      : "bg-[#0a0a0a] border-[#2c2c30] text-[#6b6b70] hover:text-[#b9b7b3] hover:border-[#4a2020]"
                  }
                `}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="amdb-mono text-[9px] text-[#47474d] mt-2">
            sports_key:{" "}
            <code className="text-[#6b6b70]">
              {sportsKey || "(none)"}
            </code>
          </div>
        </div>

        {/* Panel assignments */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map(i => (
            <label key={i} className="flex flex-col gap-1 text-xs">
              <span className="amdb-mono uppercase tracking-widest text-[#6b6b70]">
                Panel {i + 1}
              </span>

              <select
                value={panels[i]}
                onChange={e => {
                  const next = [...panels] as typeof panels;
                  next[i] = e.target.value;
                  setPanels(next);
                }}
                className="
                  amdb-mono
                  bg-[#0a0a0a]
                  border border-[#2c2c30]
                  px-3 py-2
                  rounded-sm
                  text-xs
                  text-[#d8d6d3]
                  focus:outline-none
                  focus:border-[#7a1f1f]
                "
              >
                {slots.map(o => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>

        {/* Save */}
        <div className="flex justify-end pt-1">
          <button
            onClick={() => save()}
            className="
              amdb-mono
              px-4 py-2
              bg-[#500000]
              border border-[#6b1616]
              rounded-sm
              hover:bg-[#681010]
              text-xs
              uppercase
              tracking-wide
              text-[#f0eeee]
              transition
            "
          >
            Save Rule
          </button>
        </div>
      </div>

      {/* Existing rules */}
      <div className="mb-3">
        <h2 className="amdb-display text-xl font-semibold text-[#d8d6d3]">
          Existing Rules
        </h2>
      </div>

      <div className="bg-[#111113] border border-[#232326] rounded-sm overflow-hidden">
        <div className="px-4 py-2 bg-[#18181b] border-b border-[#232326] flex items-center justify-between">
          <div className="amdb-mono text-[10px] uppercase tracking-[0.25em] text-[#6b6b70]">
            Auto-Assignment Configuration
          </div>

          <div className="amdb-mono text-[10px] uppercase tracking-widest text-[#47474d]">
            {rules.length} {rules.length === 1 ? "Rule" : "Rules"}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-[#0d0d0f] text-left border-b border-[#2c2c30]">
              <tr>
                <th className="px-4 py-3 w-16 amdb-mono text-[10px] uppercase tracking-widest text-[#6b6b70]">
                  Prio
                </th>

                <th className="px-4 py-3 amdb-mono text-[10px] uppercase tracking-widest text-[#6b6b70]">
                  Name
                </th>

                <th className="px-4 py-3 amdb-mono text-[10px] uppercase tracking-widest text-[#6b6b70]">
                  Sports
                </th>

                <th className="px-4 py-3 amdb-mono text-[10px] uppercase tracking-widest text-[#6b6b70]">
                  P1
                </th>

                <th className="px-4 py-3 amdb-mono text-[10px] uppercase tracking-widest text-[#6b6b70]">
                  P2
                </th>

                <th className="px-4 py-3 amdb-mono text-[10px] uppercase tracking-widest text-[#6b6b70]">
                  P3
                </th>

                <th className="px-4 py-3 amdb-mono text-[10px] uppercase tracking-widest text-[#6b6b70]">
                  P4
                </th>

                <th className="px-4 py-3 w-28" />
              </tr>
            </thead>

            <tbody>
              {rules.map(r => (
                <tr
                  key={r.id}
                  className="border-t border-[#232326] bg-[#111113] hover:bg-[#18181b] transition-colors"
                >
                  <td className="px-4 py-2.5 text-[#6b6b70] font-mono">
                    {r.priority}
                  </td>

                  <td className="px-4 py-2.5 text-[#e7e5e2] font-medium">
                    {r.name}
                  </td>

                  <td className="px-4 py-2.5">
                    <span className="amdb-mono text-[10px] text-[#8f8f94]">
                      {r.sports_key}
                    </span>
                  </td>

                  <td className="px-4 py-2.5 text-[#b9b7b3]">
                    {r.panel_1 || "—"}
                  </td>

                  <td className="px-4 py-2.5 text-[#b9b7b3]">
                    {r.panel_2 || "—"}
                  </td>

                  <td className="px-4 py-2.5 text-[#b9b7b3]">
                    {r.panel_3 || "—"}
                  </td>

                  <td className="px-4 py-2.5 text-[#b9b7b3]">
                    {r.panel_4 || "—"}
                  </td>

                  <td className="px-4 py-2.5">
                    <div className="flex gap-1">
                      <button
                        onClick={() => edit(r)}
                        className="
                          amdb-mono
                          text-[10px]
                          uppercase
                          tracking-wide
                          px-2.5 py-1.5
                          bg-[#18181b]
                          border border-[#2c2c30]
                          rounded-sm
                          hover:bg-[#242428]
                          hover:border-[#7a1f1f]
                          text-[#b9b7b3]
                          transition
                        "
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => del(r.id)}
                        className="
                          amdb-mono
                          text-[10px]
                          px-2.5 py-1.5
                          bg-[#300000]
                          border border-[#500000]
                          rounded-sm
                          hover:bg-[#500000]
                          text-[#c96060]
                          transition
                        "
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {rules.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="
                      px-4
                      py-10
                      text-center
                      amdb-mono
                      text-[10px]
                      uppercase
                      tracking-[0.2em]
                      text-[#47474d]
                    "
                  >
                    No rules yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between">
        <p className="amdb-mono text-[9px] uppercase tracking-[0.2em] text-[#3f3f44]">
          Panel Assignment
        </p>

        <p className="amdb-mono text-[9px] uppercase tracking-[0.2em] text-[#3f3f44]">
          Priority Rules
        </p>
      </div>
    </div>

    <div className="h-1 w-full bg-[#500000]" />
  </div>
);
}