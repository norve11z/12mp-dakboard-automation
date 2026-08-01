"use client";
import { useEffect, useState, useCallback } from "react";

interface Display {
  id: number;
  sport: string;
  game_date: string;
  display_type: string;
  ics_start: string;
  control_room_id: number | null;
  manual: number | null;
}

interface GameInfo {
  sport: string;
  game_date: string;
  opponent: string | null;
  kickoff: string | null;
  source: string;
}

interface Stats { shifts: number; seed: number; lastImport: string | null; }

const SPORTS = ["Football","Baseball","Softball","Men's Basketball","Women's Basketball","Volleyball","Soccer"];

export default function AdminDashboard() {
  const [displays, setDisplays] = useState<Display[]>([]);
  const [games, setGames] = useState<GameInfo[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [override, setOverride] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showAddGame, setShowAddGame] = useState(false);
  const [showDanger, setShowDanger] = useState(false);
  const [oldDays, setOldDays] = useState(7);

  const loadAll = useCallback(async () => {
    const [d, g, s, o] = await Promise.all([
      fetch("/api/displays").then(r => r.json()),
      fetch("/api/game-info").then(r => r.json()),
      fetch("/api/maintenance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "stats" }) }).then(r => r.json()),
      fetch("/api/settings/display-date").then(r => r.json()),
    ]);
    setDisplays(d);
    setGames(g);
    setStats(s);
    setOverride(o.display_date_override || "");
    if (!selectedDate) {
      const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
      setSelectedDate(o.display_date_override || today);
    }
  }, [selectedDate]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const runSync = async () => {
    setSyncing(true); setSyncMsg("");
    try {
      const r = await fetch("/api/sync", { method: "POST" }).then(r => r.json());
      setSyncMsg(r.ok
        ? `✓ Imported ${r.imp.inserted}, ${r.disp.count} displays, schedules updated (${r.sched.updated} games)`
        : `✗ ${r.error}`);
    } catch (e) { setSyncMsg("✗ " + String(e)); }
    setSyncing(false);
    loadAll();
  };

  const runStep = async (label: string, url: string) => {
    setSyncing(true); setSyncMsg("");
    const r = await fetch(url, { method: "POST" }).then(r => r.json());
    setSyncMsg(`${label}: ${JSON.stringify(r)}`);
    setSyncing(false);
    loadAll();
  };

  const setDateOverride = async (date: string) => {
    await fetch("/api/settings/display-date", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: date || null }),
    });
    setOverride(date);
  };

  const assignPanel = async (displayId: number, controlRoomId: number) => {
    await fetch("/api/assign", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayId, controlRoomId }),
    });
    loadAll();
  };

  const clearPanel = async (controlRoomId: number, date: string) => {
    await fetch("/api/assign", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ controlRoomId, date }),
    });
    loadAll();
  };

  const maintenance = async (action: string, extra: Record<string, unknown> = {}) => {
    if (!confirm(`Run "${action}"? This cannot be undone.`)) return;
    const r = await fetch("/api/maintenance", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    }).then(r => r.json());
    setSyncMsg(`${action}: deleted ${r.deleted ?? 0}`);
    await fetch("/api/rebuild", { method: "POST" });
    loadAll();
  };

  const dateOptions = Array.from(new Set(displays.map(d => d.game_date))).sort();
  const displaysForDate = displays.filter(d => d.game_date === selectedDate);
  const gamesForDate = games.filter(g => g.game_date === selectedDate);
  const gameFor = (sport: string) => gamesForDate.find(g => g.sport === sport);
  const displayFor = (panel: number) => displaysForDate.find(d => d.control_room_id === panel);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Status bar */}
      <div className="sticky top-0 z-10 bg-gray-950 border-b border-gray-800 py-3 mb-6 flex items-center gap-6 text-sm">
        <div><span className="text-gray-500">Shifts:</span> <strong>{stats?.shifts ?? "—"}</strong>
          {stats && stats.seed > 0 && <span className="text-yellow-400 ml-1">({stats.seed} seeded)</span>}
        </div>
        <div><span className="text-gray-500">Last import:</span>{" "}
        <strong>{stats?.lastImport ? new Date(stats.lastImport + "Z").toLocaleString("en-US", { timeZone: "America/Chicago" }) : "never"}</strong>
       </div>
        <div className="flex-1" />
        <button onClick={runSync} disabled={syncing}
          className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 font-medium">
          {syncing ? "Syncing…" : "Sync Now"}
        </button>
        <button onClick={() => setShowAdvanced(v => !v)}
          className="text-gray-500 hover:text-white text-xs">
          {showAdvanced ? "▲ hide advanced" : "▼ advanced"}
        </button>
      </div>

      {syncMsg && <div className="bg-gray-900 border border-gray-800 rounded p-2 mb-4 text-sm font-mono">{syncMsg}</div>}

      {showAdvanced && (
        <div className="bg-gray-900 border border-gray-800 rounded p-3 mb-6 flex gap-2 text-sm">
          <button onClick={() => runStep("Import ICS", "/api/import")} className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600">Import ICS</button>
          <button onClick={() => runStep("Refresh Schedules", "/api/refresh-schedules")} className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600">Refresh Schedules</button>
          <button onClick={() => runStep("Rebuild", "/api/rebuild")} className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600">Rebuild & Assign</button>
        </div>
      )}

      {/* Date selector */}
      <div className="bg-gray-900 border border-gray-800 rounded p-4 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <label className="text-sm text-gray-400">Viewing date:</label>
          <input type="date" value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="bg-gray-800 px-3 py-2 rounded" />
          {dateOptions.length > 0 && (
            <select value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              className="bg-gray-800 px-3 py-2 rounded text-sm">
              <option value="">— quick pick —</option>
              {dateOptions.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          )}
          <div className="flex-1" />
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Panel display date:</span>
            <select value={override} onChange={e => setDateOverride(e.target.value)}
              className="bg-gray-800 px-2 py-1 rounded">
              <option value="">Today (auto)</option>
              {dateOptions.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            {override && <button onClick={() => setDateOverride("")} className="text-red-400 text-xs hover:underline">clear</button>}
          </div>
        </div>
      </div>

      {/* Panel previews */}
      <h2 className="text-xl font-bold mb-3">Panels for {selectedDate || "—"}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map(p => {
          const d = displayFor(p);
          const g = d ? gameFor(d.sport) : null;
          return (
            <div key={p} className="bg-gray-900 border border-gray-800 rounded overflow-hidden flex flex-col">
              <div className="px-3 py-2 bg-gray-800 flex items-center justify-between">
                <strong>Panel {p}</strong>
                <a href={`/controlroom/${p}${override ? `?date=${override}` : ""}`}
                  target="_blank" className="text-blue-400 text-xs hover:underline">open ↗</a>
              </div>
              {d ? (
                <div className="p-3 flex-1">
                  <div className="text-lg font-bold">{d.sport}</div>
                  <div className="text-xs text-gray-400 uppercase mb-2">{d.display_type}</div>
                  {g?.opponent && <div className="text-sm">vs {g.opponent}</div>}
                  {g?.kickoff && <div className="text-xs text-gray-400">{new Date(g.kickoff).toLocaleTimeString("en-US", { timeZone: "America/Chicago", hour: "numeric", minute: "2-digit" })}</div>}
                  {d.manual === 1 && <div className="text-xs text-yellow-400 mt-2">manual</div>}
                  <button onClick={() => clearPanel(p, d.game_date)}
                    className="mt-2 text-xs text-red-400 hover:underline">unassign</button>
                </div>
              ) : (
                <div className="p-3 flex-1 flex items-center justify-center text-gray-600 text-sm">empty</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Games / displays for date */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold">Games on {selectedDate || "—"}</h2>
        <button onClick={() => setShowAddGame(true)}
          className="px-3 py-2 bg-green-600 rounded hover:bg-green-700 text-sm">
          + Add Game (Test Data)
        </button>
      </div>

      {displaysForDate.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded p-6 text-center text-gray-500">
          No games on this date. Try Sync Now or Add Game.
        </div>
      ) : (
        <table className="w-full bg-gray-900 border border-gray-800 rounded overflow-hidden text-sm mb-8">
          <thead className="bg-gray-800 text-left">
            <tr>
              <th className="p-2">Sport</th>
              <th className="p-2">Type</th>
              <th className="p-2">Opponent</th>
              <th className="p-2">Kickoff</th>
              <th className="p-2">Source</th>
              <th className="p-2">Panel</th>
            </tr>
          </thead>
          <tbody>
            {displaysForDate.map(d => {
              const g = gameFor(d.sport);
              return (
                <tr key={d.id} className="border-t border-gray-800">
                  <td className="p-2 font-medium">{d.sport}</td>
                  <td className="p-2 text-gray-400">{d.display_type}</td>
                  <td className="p-2">{g?.opponent || <span className="text-gray-600">—</span>}</td>
                  <td className="p-2">{g?.kickoff ? new Date(g.kickoff).toLocaleTimeString("en-US", { timeZone: "America/Chicago", hour: "numeric", minute: "2-digit" }) : <span className="text-gray-600">TBD</span>}</td>
                  <td className="p-2">
                    <span className={g?.source === "manual" ? "text-yellow-400 text-xs" : "text-gray-500 text-xs"}>{g?.source || "—"}</span>
                  </td>
                  <td className="p-2">
                    <select value={d.control_room_id ?? ""}
                      onChange={e => assignPanel(d.id, Number(e.target.value))}
                      className="bg-gray-800 px-2 py-1 rounded">
                      <option value="">—</option>
                      {[1, 2, 3, 4].map(p => <option key={p} value={p}>Panel {p}</option>)}
                    </select>
                    {d.manual === 1 && <span className="ml-2 text-yellow-400 text-xs">manual</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Danger zone */}
      <div className="mt-8 border-t border-gray-800 pt-4">
        <button onClick={() => setShowDanger(v => !v)}
          className="text-red-400 text-sm hover:underline">
          {showDanger ? "▲ hide" : "▼ show"} maintenance
        </button>
        {showDanger && (
          <div className="mt-3 bg-red-950/30 border border-red-900 rounded p-4 flex flex-wrap gap-3 text-sm">
            <button onClick={() => maintenance("clear-seed")}
              className="px-3 py-2 bg-red-800 rounded hover:bg-red-900">
              Clear Test Data (SEED-*)
            </button>
            <div className="flex items-center gap-2 bg-red-900/40 px-3 py-2 rounded">
              <span>Clear shifts older than</span>
              <input type="number" value={oldDays} onChange={e => setOldDays(Number(e.target.value))}
                className="bg-gray-800 px-2 py-1 rounded w-16" min={1} />
              <span>days</span>
              <button onClick={() => maintenance("clear-old", { days: oldDays })}
                className="px-2 py-1 bg-red-800 rounded hover:bg-red-900">go</button>
            </div>
            <button onClick={() => maintenance("clear-all")}
              className="px-3 py-2 bg-red-800 rounded hover:bg-red-900">
              Clear ALL Shifts
            </button>
          </div>
        )}
      </div>

      {showAddGame && <AddGameModal
        onClose={() => setShowAddGame(false)}
        onDone={() => { setShowAddGame(false); loadAll(); }}
        defaultDate={selectedDate}
      />}
    </div>
  );
}

interface MappedPosition { ics_position: string; short_label: string; display_order: number; }
interface CrewInput { position: string; name: string; custom: boolean; }

function AddGameModal({ onClose, onDone, defaultDate }: { onClose: () => void; onDone: () => void; defaultDate: string; }) {
  const [sport, setSport] = useState("Football");
  const [game_date, setGameDate] = useState(defaultDate);
  const [display_type, setType] = useState<"broadcast" | "bigscreen">("broadcast");
  const [crew_call, setCrewCall] = useState("06:00");
  const [kickoff, setKickoff] = useState("11:00");
  const [opponent, setOpponent] = useState("");
  const [positions, setPositions] = useState<MappedPosition[]>([]);
  const [crew, setCrew] = useState<CrewInput[]>([{ position: "", name: "", custom: false }]);

  useEffect(() => {
    fetch(`/api/positions-for-category?sport=${encodeURIComponent(sport)}&display_type=${display_type}`)
      .then(r => r.json())
      .then(setPositions);
  }, [sport, display_type]);

  const updateRow = (i: number, patch: Partial<CrewInput>) => {
    setCrew(prev => prev.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  };
  const addRow = () => setCrew(prev => [...prev, { position: "", name: "", custom: false }]);
  const removeRow = (i: number) => setCrew(prev => prev.filter((_, idx) => idx !== i));

  const fillFromTemplate = () => {
    if (positions.length === 0) { alert("No positions mapped for this category. Set them in Positions first."); return; }
    setCrew(positions.map(p => ({ position: p.ics_position, name: "", custom: false })));
  };

  const submit = async () => {
    const valid = crew
      .map(c => ({ position: c.position.trim(), name: c.name.trim() }))
      .filter(c => c.position && c.name);
    if (valid.length === 0) { alert("Add at least one crew member with a name."); return; }

    const res = await fetch("/api/add-game", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sport, game_date, display_type, crew_call, kickoff, opponent, crew: valid }),
    });
    const data = await res.json();
    if (!data.ok) { alert("Error: " + data.error); return; }
    onDone();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-3xl m-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Add Game (Test Data)</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white">✕</button>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Creates fake shifts (prefixed <code>SEED-</code>) and game info. Use the danger zone to remove them later.
        </p>

        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <label className="flex flex-col gap-1">
            <span className="text-gray-400">Sport</span>
            <select value={sport} onChange={e => setSport(e.target.value)}
              className="bg-gray-800 px-2 py-1 rounded">
              {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-gray-400">Display Type</span>
            <select value={display_type} onChange={e => setType(e.target.value as "broadcast" | "bigscreen")}
              className="bg-gray-800 px-2 py-1 rounded">
              <option value="broadcast">Broadcast</option>
              <option value="bigscreen">Big Screen</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-gray-400">Date</span>
            <input type="date" value={game_date} onChange={e => setGameDate(e.target.value)}
              className="bg-gray-800 px-2 py-1 rounded" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-gray-400">Opponent</span>
            <input value={opponent} onChange={e => setOpponent(e.target.value)}
              placeholder="e.g. LSU"
              className="bg-gray-800 px-2 py-1 rounded" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-gray-400">Crew Call</span>
            <input type="time" value={crew_call} onChange={e => setCrewCall(e.target.value)}
              className="bg-gray-800 px-2 py-1 rounded" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-gray-400">Kickoff / Game Time</span>
            <input type="time" value={kickoff} onChange={e => setKickoff(e.target.value)}
              className="bg-gray-800 px-2 py-1 rounded" />
          </label>
        </div>

        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold text-sm">Crew</h4>
          <div className="flex gap-2">
            <button onClick={fillFromTemplate}
              className="px-3 py-1 bg-purple-700 rounded hover:bg-purple-800 text-xs">
              Fill from template
            </button>
            <button onClick={addRow}
              className="px-3 py-1 bg-green-700 rounded hover:bg-green-800 text-xs">
              + Add row
            </button>
          </div>
        </div>

        <table className="w-full text-sm bg-gray-950 border border-gray-800 rounded overflow-hidden mb-4">
          <thead className="bg-gray-800 text-left text-xs">
            <tr>
              <th className="p-2 w-56">Position</th>
              <th className="p-2">Name</th>
              <th className="p-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {crew.map((row, i) => (
              <tr key={i} className="border-t border-gray-800">
                <td className="p-1">
                  {row.custom ? (
                    <div className="flex gap-1">
                      <input value={row.position} onChange={e => updateRow(i, { position: e.target.value })}
                        placeholder="Custom position"
                        className="bg-gray-800 px-2 py-1 rounded w-full" />
                      <button onClick={() => updateRow(i, { custom: false, position: "" })}
                        className="text-xs text-gray-400 hover:text-white">↩</button>
                    </div>
                  ) : (
                    <select value={row.position}
                      onChange={e => {
                        if (e.target.value === "__custom__") updateRow(i, { custom: true, position: "" });
                        else updateRow(i, { position: e.target.value });
                      }}
                      className="bg-gray-800 px-2 py-1 rounded w-full">
                      <option value="">— select —</option>
                      {positions.map(p => (
                        <option key={p.ics_position} value={p.ics_position}>
                          {p.short_label} ({p.ics_position})
                        </option>
                      ))}
                      <option value="__custom__">+ Custom position…</option>
                    </select>
                  )}
                </td>
                <td className="p-1">
                  <input value={row.name} onChange={e => updateRow(i, { name: e.target.value })}
                    placeholder="Full name"
                    className="bg-gray-800 px-2 py-1 rounded w-full" />
                </td>
                <td className="p-1 text-center">
                  <button onClick={() => removeRow(i)}
                    className="text-red-400 hover:text-red-300">✕</button>
                </td>
              </tr>
            ))}
            {crew.length === 0 && (
              <tr><td colSpan={3} className="p-3 text-center text-gray-500">No crew — click Add row.</td></tr>
            )}
          </tbody>
        </table>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 bg-gray-700 rounded hover:bg-gray-600">Cancel</button>
          <button onClick={submit} className="px-4 py-2 bg-green-600 rounded hover:bg-green-700 font-medium">Add Game</button>
        </div>
      </div>
    </div>
  );
}