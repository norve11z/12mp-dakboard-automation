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
  crew_count: number | null;
  crew_call: string | null;
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
  const [refreshingDakboard, setRefreshingDakboard] = useState(false);
  const [lookaheadDays, setLookaheadDays] = useState<number>(0);

  const loadAll = useCallback(async () => {
    const res = await fetch("/api/dashboard", {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Dashboard load failed: ${res.status}`);
    }

    const data = await res.json();

    setDisplays(data.displays);
    setGames(data.games);
    setStats(data.stats);
    setOverride(data.display_date_override || "");
    setLookaheadDays(data.lookahead_days ?? 0);

    setSelectedDate(
      current => current || data.display_date_override || data.today
    );
  }, []);




  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const runSync = async () => {
    setSyncing(true); setSyncMsg("");
    try {
      const r = await fetch("/api/sync", { method: "POST" }).then(r => r.json());
      setSyncMsg(r.ok
        ? `✓ Imported ${r.imp.inserted}, ${r.disp.count} displays, schedules updated (${r.sched.updated} games)`
        : `✗ ${r.error}`);
    } catch (e) { setSyncMsg("✗ " + String(e)); }
    setSyncing(false);
    await loadAll();
  };

  const refreshDakboard = async () => {
    setRefreshingDakboard(true);
    setSyncMsg("");

    try {
      const r = await fetch("/api/dakboard/refresh", {
        method: "POST",
      });

      const data = await r.json();

      setSyncMsg(
        data.ok
          ? "✓ DAKboard refresh requested"
          : `✗ ${data.error}`
      );
    } catch (e) {
      setSyncMsg("✗ DAKboard refresh failed: " + String(e));
    } finally {
      setRefreshingDakboard(false);
    }
  };

  const runStep = async (label: string, url: string) => {
    setSyncing(true); setSyncMsg("");
    const r = await fetch(url, { method: "POST" }).then(r => r.json());
    setSyncMsg(`${label}: ${JSON.stringify(r)}`);
    setSyncing(false);
    await loadAll();
  };

  const setDateOverride = async (date: string) => {
    // Update UI immediately.
    setOverride(date);
    setSelectedDate(date);

    try {
      const res = await fetch("/api/settings/display-date", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: date || null }),
      });

      if (!res.ok) {
        throw new Error(`Date update failed: ${res.status}`);
      }
    } catch (e) {
      setSyncMsg(
        `✗ ${e instanceof Error ? e.message : String(e)}`
      );

      await loadAll();
    }
  };

  const assignPanel = async (displayId: number, controlRoomId: number) => {
    await fetch("/api/assign", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayId, controlRoomId }),
    });
    await loadAll();
  };

  const clearPanel = async (controlRoomId: number, date: string) => {
    await fetch("/api/assign", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ controlRoomId, date }),
    });
    await loadAll();
  };

  const resetAllToAuto = async () => {
  if (!selectedDate) return;

  const res = await fetch("/api/auto-assign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date: selectedDate }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || `Auto-assign failed: ${res.status}`);
  }

  await loadAll();
};

const gamesForDate = games.filter(
  g => g.game_date === selectedDate
);

const displaysForDate = displays.filter(
  d => d.game_date === selectedDate
);

// One entry per actual display.
// The dashboard query can return the same display multiple
// times because it joins against assignments.
const uniqueDisplaysForDate = Array.from(
  new Map(displaysForDate.map(d => [d.id, d])).values()
);


const panelsForGame = (game: any) => {
  const gameDisplays = displaysForDate.filter(
    d => d.sport === game.sport
  );

  const bigscreenPanels = gameDisplays
    .filter(
      d =>
        d.display_type === "bigscreen" &&
        d.control_room_id
    )
    .map(d => Number(d.control_room_id));

  const broadcastPanels = gameDisplays
    .filter(
      d =>
        d.display_type === "broadcast" &&
        d.control_room_id
    )
    .map(d => Number(d.control_room_id));

  return {
    bigscreen: [...new Set(bigscreenPanels)].sort(),
    broadcast: [...new Set(broadcastPanels)].sort(),
  };
};

  const maintenance = async (action: string, extra: Record<string, unknown> = {}) => {
    if (!confirm(`Run "${action}"? This cannot be undone.`)) return;
    const r = await fetch("/api/maintenance", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    }).then(r => r.json());
    setSyncMsg(`${action}: deleted ${r.deleted ?? 0}`);
    await fetch("/api/rebuild", { method: "POST" });
    await loadAll();
  };

  const gameFor = (sport: string) => gamesForDate.find(g => g.sport === sport);
  const displayFor = (panel: number) => displaysForDate.find(d => d.control_room_id === panel);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e7e5e2] font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        .amdb-display { font-family: 'Oswald', 'Arial Narrow', sans-serif; }
        .amdb-mono { font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace; }
        .amdb-scope input[type="date"]::-webkit-calendar-picker-indicator,
        .amdb-scope input[type="time"]::-webkit-calendar-picker-indicator { filter: invert(0.55); cursor: pointer; }
        .amdb-scope select { color-scheme: dark; }
        .amdb-scope ::-webkit-scrollbar { width: 10px; height: 10px; }
        .amdb-scope ::-webkit-scrollbar-track { background: #131316; }
        .amdb-scope ::-webkit-scrollbar-thumb { background: #313136; border-radius: 2px; }
        .amdb-scope ::-webkit-scrollbar-thumb:hover { background: #47474d; }
        .amdb-tally { box-shadow: 0 0 5px 0 currentColor; }
      `}</style>

      <div className="amdb-scope max-w-[1400px] mx-auto px-6 pb-14">

        {/* Masthead + status bar */}
        <div className="sticky top-0 z-20 -mx-6 px-6 bg-[#0a0a0a]/97 backdrop-blur border-b border-[#3d1414]">
          <div className="flex items-center gap-7 text-sm border-t border-[#1c1c1f] py-3">
            <div className="flex items-baseline gap-2">
              <span className="amdb-mono text-[10px] uppercase tracking-widest text-[#6b6b70]">Shifts</span>
              <strong className="amdb-mono text-base text-[#e7e5e2]">{stats?.shifts ?? "—"}</strong>
              {stats && stats.seed > 0 && (
                <span className="amdb-mono text-[10px] uppercase tracking-wide text-[#c99a3e]">({stats.seed} seeded)</span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="amdb-mono text-[10px] uppercase tracking-widest text-[#6b6b70]">Last Import</span>
              <strong className="amdb-mono text-sm text-[#e7e5e2]">
                {stats?.lastImport ? new Date(stats.lastImport + "Z").toLocaleString("en-US", { timeZone: "America/Chicago" }) : "never"}
              </strong>
            </div>

            <div className="flex-1" />
            <button
              onClick={refreshDakboard}
              disabled={refreshingDakboard}
              className="amdb-mono px-4 py-1.5 text-xs font-semibold uppercase tracking-wider bg-[#1a1a1d] border border-[#47474d] text-[#d8d6d3] rounded-sm hover:bg-[#242428] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {refreshingDakboard ? "Refreshing…" : "↻ Refresh DAKboard"}
            </button>
            <button onClick={runSync} disabled={syncing}
              className="amdb-mono px-4 py-1.5 text-xs font-semibold uppercase tracking-wider bg-[#500000] border border-[#7a1f1f] text-[#f3e6e6] rounded-sm hover:bg-[#631515] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              {syncing ? "Syncing…" : "Sync Shifts"}
            </button>
            <button onClick={() => setShowAdvanced(v => !v)}
              className="amdb-mono text-[11px] uppercase tracking-wider text-[#6b6b70] hover:text-[#e7e5e2] transition-colors">
              {showAdvanced ? "▲ hide advanced" : "▼ advanced"}
            </button>
          </div>
        </div>

        {syncMsg && (
          <div className="amdb-mono mt-5 text-xs text-[#b9b7b3] bg-[#111113] border-l-2 border-[#7a1f1f] px-3 py-2">
            {syncMsg}
          </div>
        )}

        {showAdvanced && (
          <div className="mt-4 bg-[#111113] border border-[#232326] rounded-sm p-3 flex gap-2 text-xs">
            <button onClick={() => runStep("Import ICS", "/api/import")}
              className="amdb-mono px-3 py-1.5 uppercase tracking-wide bg-[#1a1a1d] border border-[#2c2c30] rounded-sm hover:border-[#47474d] hover:bg-[#202023] transition-colors">
              Import ICS
            </button>
            <button onClick={() => runStep("Refresh Schedules", "/api/refresh-schedules")}
              className="amdb-mono px-3 py-1.5 uppercase tracking-wide bg-[#1a1a1d] border border-[#2c2c30] rounded-sm hover:border-[#47474d] hover:bg-[#202023] transition-colors">
              Refresh Schedules
            </button>
            <button onClick={() => runStep("Rebuild", "/api/rebuild")}
              className="amdb-mono px-3 py-1.5 uppercase tracking-wide bg-[#1a1a1d] border border-[#2c2c30] rounded-sm hover:border-[#47474d] hover:bg-[#202023] transition-colors">
              Rebuild &amp; Assign
            </button>
          </div>
        )}

        {/* Date selector */}
        <div className="mt-6 bg-[#111113] border border-[#232326] rounded-sm p-4 flex items-center gap-3 flex-wrap">
          <label className="amdb-mono text-[10px] uppercase tracking-widest text-[#6b6b70]">
            Display Date
          </label>

          <input
            type="date"
            value={override || selectedDate}
            onChange={(e) => {
              setDateOverride(e.target.value);
              setSelectedDate(e.target.value);
            }}
            className="amdb-mono bg-[#0a0a0a] border border-[#2c2c30] px-3 py-1.5 rounded-sm text-sm focus:outline-none focus:border-[#7a1f1f]"
          />

          <label className="amdb-mono text-[10px] uppercase tracking-widest text-[#6b6b70] ml-2">
            Lookahead
          </label>

          <select
            value={lookaheadDays}
            onChange={async (e) => {
              const v = Number(e.target.value);
              setLookaheadDays(v);
              await fetch("/api/settings/lookahead", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ days: v }),
              });
            }}
            className="amdb-mono bg-[#0a0a0a] border border-[#2c2c30] px-3 py-1.5 rounded-sm text-sm focus:outline-none focus:border-[#7a1f1f]"
          >
            <option value="0">Today only</option>
            <option value="1">1 day out</option>
            <option value="3">3 days out</option>
            <option value="7">1 week out</option>
          </select>

          <button
            onClick={() => {
              const today = new Date().toLocaleDateString("en-CA", {
                timeZone: "America/Chicago",
              });
              setDateOverride("");
              setSelectedDate(today);
            }}
            className="amdb-mono px-3 py-1.5 text-xs uppercase tracking-wide bg-[#1a1a1d] border border-[#2c2c30] rounded-sm hover:border-[#47474d] hover:bg-[#202023] transition-colors"
          >
            Clear Override
          </button>

          <div className="amdb-mono text-xs ml-2">
            {override ? (
              <span className="text-[#c99a3e] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c99a3e] amdb-tally inline-block" />
                Override active — panels show {override}
              </span>
            ) : lookaheadDays > 0 ? (
              <span className="text-[#4a9d5f] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4a9d5f] amdb-tally inline-block" />
                Auto — showing next game within {lookaheadDays} day{lookaheadDays === 1 ? "" : "s"}
              </span>
            ) : (
              <span className="text-[#6b6b70] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4a9d5f] amdb-tally inline-block" />
                Showing today
              </span>
            )}
          </div>
        </div>

        {/* Panel previews */}
        <div className="flex items-center justify-between mt-9 mb-3">
          <div className="flex items-baseline gap-2">
            <h2 className="amdb-display text-base font-semibold uppercase tracking-wide text-[#d8d6d3]">
              Panels
            </h2>
            <span className="amdb-mono text-xs text-[#6b6b70]">
              {selectedDate || "—"}
            </span>
          </div>

          <button
            onClick={resetAllToAuto}
            disabled={!selectedDate}
            className="amdb-mono px-3 py-1.5 text-xs uppercase tracking-wide bg-[#211b13] border border-[#59431f] text-[#c99a3e] rounded-sm hover:bg-[#2b2317] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Auto
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
          {[1, 2, 3, 4].map(p => {
            const d = displayFor(p);
            const g = d ? gameFor(d.sport) : null;
            const dotColor = !d ? "#47474d" : d.manual === 1 ? "#c99a3e" : "#4a9d5f";
            const statusLabel = !d ? "empty" : d.manual === 1 ? "manual" : "auto";
            return (
              <div key={p} className="bg-[#111113] border border-[#232326] rounded-sm overflow-hidden flex flex-col">
                <div className="px-3 py-2 bg-[#18181b] border-b border-[#232326] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full amdb-tally inline-block" style={{ backgroundColor: dotColor, color: dotColor }} />
                    <strong className="amdb-mono text-xs uppercase tracking-widest text-[#d8d6d3]">Panel {p}</strong>
                  </div>
                  <a href={`/controlroom/${p}${override ? `?date=${override}` : ""}`}
                    target="_blank" className="amdb-mono text-[10px] uppercase tracking-wide text-[#8f5757] hover:text-[#c96060]">
                    open ↗
                  </a>
                </div>
                {d ? (
                  <div className="p-3 flex-1 flex flex-col gap-1">
                    <div className="amdb-display text-lg font-semibold leading-tight text-[#e7e5e2]">{d.sport}</div>
                    <div className="amdb-mono text-[10px] uppercase tracking-widest text-[#6b6b70]">{d.display_type}</div>
                    {g?.opponent && <div className="text-sm mt-1 text-[#b9b7b3]">vs {g.opponent}</div>}
                    <div className="amdb-mono text-[11px] text-[#7d7d82] mt-1.5 space-y-0.5">
                      {d.crew_call && <div>Crew call: {new Date(d.crew_call).toLocaleTimeString("en-US", { timeZone: "America/Chicago", hour: "numeric", minute: "2-digit" })}</div>}
                      {g?.kickoff && <div>Kickoff: {new Date(g.kickoff).toLocaleTimeString("en-US", { timeZone: "America/Chicago", hour: "numeric", minute: "2-digit" })}</div>}
                      <div>Crew: {d.crew_count ?? 0}</div>
                    </div>
                    <div className="flex-1" />
                    <div className="amdb-mono text-[10px] uppercase tracking-widest mt-1" style={{ color: dotColor }}>{statusLabel}</div>
                  </div>
                ) : (
                  <div className="p-3 flex-1 flex items-center justify-center text-[#47474d] text-xs amdb-mono uppercase tracking-widest">empty</div>
                )}
                <div className="p-2 border-t border-[#232326]">
                  <select
                    value={d?.id ?? ""}
                    onChange={e => {
                      const val = e.target.value;
                      if (!val) clearPanel(p, selectedDate);
                      else assignPanel(Number(val), p);
                    }}
                    className="amdb-mono bg-[#0a0a0a] border border-[#2c2c30] px-2 py-1.5 rounded-sm text-xs w-full focus:outline-none focus:border-[#7a1f1f]"
                  >
                <option value="">— empty —</option>
                {uniqueDisplaysForDate
                  .filter((x) => x.display_type !== "engineering" || p === 2)
                  .map((x) => {
                    const label =
                      x.display_type === "engineering"
                        ? "Engineering (auto)"
                        : `${x.sport} ${x.display_type === "bigscreen" ? "BS" : "BC"}`;
                    return (
                      <option key={x.id} value={x.id}>
                        {label}
                      </option>
                    );
                  })}
                  </select>
                </div>
              </div>
            );
          })}
        </div>

        {/* Games / displays for date */}
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-baseline gap-2">
        <h2 className="amdb-display text-base font-semibold uppercase tracking-wide text-[#d8d6d3]">
          Games
        </h2>
        <span className="amdb-mono text-xs text-[#6b6b70]">
          {selectedDate || "—"}
        </span>
      </div>

      <button
        onClick={() => setShowAddGame(true)}
        className="amdb-mono px-3 py-1.5 text-xs uppercase tracking-wide bg-[#16321f] border border-[#2b5236] text-[#8fd4a2] rounded-sm hover:bg-[#1b3d26] transition-colors"
      >
        + Add Game (Test Data)
      </button>
    </div>

    {gamesForDate.length === 0 ? (
      <div className="bg-[#111113] border border-[#232326] rounded-sm p-8 text-center text-[#5f5f64] amdb-mono text-xs uppercase tracking-wide mb-10">
        No games on this date. Try Sync Now or Add Game.
      </div>
    ) : (
      <table className="w-full bg-[#111113] border border-[#232326] rounded-sm overflow-hidden text-sm mb-10 border-collapse">
        <thead className="bg-[#18181b]">
          <tr>
            <th className="amdb-mono text-left p-2.5 text-[10px] uppercase tracking-widest text-[#6b6b70] font-medium">
              Sport
            </th>

            <th className="amdb-mono text-left p-2.5 text-[10px] uppercase tracking-widest text-[#6b6b70] font-medium">
              Opponent
            </th>

            <th className="amdb-mono text-left p-2.5 text-[10px] uppercase tracking-widest text-[#6b6b70] font-medium">
              Kickoff
            </th>

            <th className="amdb-mono text-left p-2.5 text-[10px] uppercase tracking-widest text-[#6b6b70] font-medium">
              Source
            </th>

            <th className="amdb-mono text-left p-2.5 text-[10px] uppercase tracking-widest text-[#6b6b70] font-medium">
              Panels
            </th>
          </tr>
        </thead>

    <tbody>
      {gamesForDate.map(game => {
        const panels = panelsForGame(game);

        return (
          <tr
            key={`${game.sport}-${game.game_date}`}
            className="border-t border-[#1c1c1f] hover:bg-[#151517] transition-colors"
          >
            <td className="p-2.5 font-medium text-[#e7e5e2]">
              {game.sport}
            </td>

            <td className="p-2.5 text-[#b9b7b3]">
              {game.opponent || (
                <span className="text-[#47474d]">—</span>
              )}
            </td>

            <td className="p-2.5 amdb-mono text-xs text-[#b9b7b3]">
              {game.kickoff ? (
                new Date(game.kickoff).toLocaleTimeString("en-US", {
                  timeZone: "America/Chicago",
                  hour: "numeric",
                  minute: "2-digit",
                })
              ) : (
                <span className="text-[#47474d]">TBD</span>
              )}
            </td>

            <td className="p-2.5">
              <span
                className={
                  "amdb-mono text-[10px] uppercase tracking-wide " +
                  (game.source === "manual"
                    ? "text-[#c99a3e]"
                    : "text-[#5f5f64]")
                }
              >
                {game.source || "—"}
              </span>
            </td>

            <td className="p-2.5">
              <div className="flex flex-wrap gap-1.5">
                {panels.bigscreen.length > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="amdb-mono text-[9px] uppercase tracking-wide text-[#6b6b70] mr-0.5">
                      BS
                    </span>

                    {panels.bigscreen.map(panel => (
                      <span
                        key={`bs-${panel}`}
                        className="amdb-mono px-1.5 py-0.5 bg-[#1a1a1d] border border-[#2c2c30] rounded-sm text-[10px] text-[#b9b7b3]"
                      >
                        P{panel}
                      </span>
                    ))}
                  </div>
                )}

                {panels.broadcast.length > 0 && (
                  <div className="flex items-center gap-1 ml-2">
                    <span className="amdb-mono text-[9px] uppercase tracking-wide text-[#6b6b70] mr-0.5">
                      BC
                    </span>

                    {panels.broadcast.map(panel => (
                      <span
                        key={`bc-${panel}`}
                        className="amdb-mono px-1.5 py-0.5 bg-[#1a1a1d] border border-[#2c2c30] rounded-sm text-[10px] text-[#b9b7b3]"
                      >
                        P{panel}
                      </span>
                    ))}
                  </div>
                )}

                {panels.bigscreen.length === 0 &&
                  panels.broadcast.length === 0 && (
                    <span className="text-[#47474d]">—</span>
                  )}
              </div>
            </td>
          </tr>
        );
      })}
    </tbody>
  </table>
)}

        {/* Danger zone */}
        <div className="mt-10 border-t border-[#232326] pt-5">
          <button onClick={() => setShowDanger(v => !v)}
            className="amdb-mono text-xs uppercase tracking-widest text-[#8f5757] hover:text-[#c96060] transition-colors">
            {showDanger ? "▲ hide" : "▼ show"} maintenance
          </button>
          {showDanger && (
            <div className="mt-3 bg-[#1a0d0d] border border-[#3d1414] rounded-sm p-4 flex flex-wrap gap-3 text-sm">
              <button onClick={() => maintenance("clear-seed")}
                className="amdb-mono px-3 py-2 text-xs uppercase tracking-wide bg-[#5a1414] border border-[#7a1f1f] rounded-sm hover:bg-[#6b1818] transition-colors">
                Clear Test Data (SEED-*)
              </button>
              <div className="flex items-center gap-2 bg-[#2a1010] border border-[#4a1919] px-3 py-2 rounded-sm">
                <span className="amdb-mono text-xs uppercase tracking-wide text-[#c9a3a3]">Clear shifts older than</span>
                <input type="number" value={oldDays} onChange={e => setOldDays(Number(e.target.value))}
                  className="amdb-mono bg-[#0a0a0a] border border-[#4a1919] px-2 py-1 rounded-sm w-16 text-center focus:outline-none" min={1} />
                <span className="amdb-mono text-xs uppercase tracking-wide text-[#c9a3a3]">days</span>
                <button onClick={() => maintenance("clear-old", { days: oldDays })}
                  className="amdb-mono px-2.5 py-1 text-xs uppercase bg-[#5a1414] border border-[#7a1f1f] rounded-sm hover:bg-[#6b1818] transition-colors">go</button>
              </div>
              <button onClick={() => maintenance("clear-all")}
                className="amdb-mono px-3 py-2 text-xs uppercase tracking-wide bg-[#5a1414] border border-[#7a1f1f] rounded-sm hover:bg-[#6b1818] transition-colors">
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
    <div className="amdb-scope fixed inset-0 bg-black/75 flex items-center justify-center z-50" onClick={onClose}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        .amdb-display { font-family: 'Oswald', 'Arial Narrow', sans-serif; }
        .amdb-mono { font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace; }
      `}</style>
      <div className="bg-[#111113] border border-[#2c2c30] rounded-sm w-full max-w-3xl m-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#232326]">
          <h3 className="amdb-display text-lg font-semibold uppercase tracking-wide text-[#d8d6d3]">Add Game <span className="text-[#6b6b70] text-sm normal-case tracking-normal">(Test Data)</span></h3>
          <button onClick={onClose} className="text-[#6b6b70] hover:text-[#e7e5e2] text-lg leading-none">✕</button>
        </div>

        <div className="px-6 pt-4">
          <p className="amdb-mono text-[11px] text-[#6b6b70] border-l-2 border-[#c99a3e] pl-3 mb-5">
            Creates fake shifts (prefixed <span className="text-[#c99a3e]">SEED-</span>) and game info. Use the maintenance panel to remove them later.
          </p>

          <div className="grid grid-cols-2 gap-3 text-sm mb-5">
            <label className="flex flex-col gap-1.5">
              <span className="amdb-mono text-[10px] uppercase tracking-widest text-[#6b6b70]">Sport</span>
              <select value={sport} onChange={e => setSport(e.target.value)}
                className="amdb-mono bg-[#0a0a0a] border border-[#2c2c30] px-2.5 py-1.5 rounded-sm focus:outline-none focus:border-[#7a1f1f]">
                {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="amdb-mono text-[10px] uppercase tracking-widest text-[#6b6b70]">Display Type</span>
              <select value={display_type} onChange={e => setType(e.target.value as "broadcast" | "bigscreen")}
                className="amdb-mono bg-[#0a0a0a] border border-[#2c2c30] px-2.5 py-1.5 rounded-sm focus:outline-none focus:border-[#7a1f1f]">
                <option value="broadcast">Broadcast</option>
                <option value="bigscreen">Big Screen</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="amdb-mono text-[10px] uppercase tracking-widest text-[#6b6b70]">Date</span>
              <input type="date" value={game_date} onChange={e => setGameDate(e.target.value)}
                className="amdb-mono bg-[#0a0a0a] border border-[#2c2c30] px-2.5 py-1.5 rounded-sm focus:outline-none focus:border-[#7a1f1f]" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="amdb-mono text-[10px] uppercase tracking-widest text-[#6b6b70]">Opponent</span>
              <input value={opponent} onChange={e => setOpponent(e.target.value)}
                placeholder="e.g. LSU"
                className="bg-[#0a0a0a] border border-[#2c2c30] px-2.5 py-1.5 rounded-sm placeholder:text-[#47474d] focus:outline-none focus:border-[#7a1f1f]" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="amdb-mono text-[10px] uppercase tracking-widest text-[#6b6b70]">Crew Call</span>
              <input type="time" value={crew_call} onChange={e => setCrewCall(e.target.value)}
                className="amdb-mono bg-[#0a0a0a] border border-[#2c2c30] px-2.5 py-1.5 rounded-sm focus:outline-none focus:border-[#7a1f1f]" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="amdb-mono text-[10px] uppercase tracking-widest text-[#6b6b70]">Kickoff / Game Time</span>
              <input type="time" value={kickoff} onChange={e => setKickoff(e.target.value)}
                className="amdb-mono bg-[#0a0a0a] border border-[#2c2c30] px-2.5 py-1.5 rounded-sm focus:outline-none focus:border-[#7a1f1f]" />
            </label>
          </div>

          <div className="flex items-center justify-between mb-2">
            <h4 className="amdb-mono text-[11px] uppercase tracking-widest text-[#6b6b70] font-semibold">Crew</h4>
            <div className="flex gap-2">
              <button onClick={fillFromTemplate}
                className="amdb-mono px-3 py-1.5 text-[11px] uppercase tracking-wide bg-[#241a33] border border-[#3d2a54] text-[#c3a8e8] rounded-sm hover:bg-[#2c2040] transition-colors">
                Fill from Template
              </button>
              <button onClick={addRow}
                className="amdb-mono px-3 py-1.5 text-[11px] uppercase tracking-wide bg-[#16321f] border border-[#2b5236] text-[#8fd4a2] rounded-sm hover:bg-[#1b3d26] transition-colors">
                + Add Row
              </button>
            </div>
          </div>

          <table className="w-full text-sm bg-[#0a0a0a] border border-[#232326] rounded-sm overflow-hidden mb-6">
            <thead className="bg-[#18181b]">
              <tr>
                <th className="amdb-mono text-left p-2 w-56 text-[10px] uppercase tracking-widest text-[#6b6b70] font-medium">Position</th>
                <th className="amdb-mono text-left p-2 text-[10px] uppercase tracking-widest text-[#6b6b70] font-medium">Name</th>
                <th className="p-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {crew.map((row, i) => (
                <tr key={i} className="border-t border-[#1c1c1f]">
                  <td className="p-1.5">
                    {row.custom ? (
                      <div className="flex gap-1">
                        <input value={row.position} onChange={e => updateRow(i, { position: e.target.value })}
                          placeholder="Custom position"
                          className="bg-[#111113] border border-[#2c2c30] px-2 py-1 rounded-sm w-full placeholder:text-[#47474d] focus:outline-none focus:border-[#7a1f1f]" />
                        <button onClick={() => updateRow(i, { custom: false, position: "" })}
                          className="text-xs text-[#6b6b70] hover:text-[#e7e5e2] px-1">↩</button>
                      </div>
                    ) : (
                      <select value={row.position}
                        onChange={e => {
                          if (e.target.value === "__custom__") updateRow(i, { custom: true, position: "" });
                          else updateRow(i, { position: e.target.value });
                        }}
                        className="amdb-mono bg-[#111113] border border-[#2c2c30] px-2 py-1 rounded-sm w-full text-xs focus:outline-none focus:border-[#7a1f1f]">
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
                  <td className="p-1.5">
                    <input value={row.name} onChange={e => updateRow(i, { name: e.target.value })}
                      placeholder="Full name"
                      className="bg-[#111113] border border-[#2c2c30] px-2 py-1 rounded-sm w-full placeholder:text-[#47474d] focus:outline-none focus:border-[#7a1f1f]" />
                  </td>
                  <td className="p-1.5 text-center">
                    <button onClick={() => removeRow(i)}
                      className="text-[#8f5757] hover:text-[#c96060]">✕</button>
                  </td>
                </tr>
              ))}
              {crew.length === 0 && (
                <tr><td colSpan={3} className="p-4 text-center text-[#5f5f64] amdb-mono text-xs uppercase tracking-wide">No crew — click Add Row.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-2 px-6 pb-6">
          <button onClick={onClose} className="amdb-mono px-4 py-2 text-xs uppercase tracking-wide bg-[#1a1a1d] border border-[#2c2c30] rounded-sm hover:border-[#47474d] hover:bg-[#202023] transition-colors">Cancel</button>
          <button onClick={submit} className="amdb-mono px-4 py-2 text-xs uppercase tracking-wide bg-[#500000] border border-[#7a1f1f] text-[#f3e6e6] rounded-sm hover:bg-[#631515] transition-colors">Add Game</button>
        </div>
      </div>
    </div>
  );
}
