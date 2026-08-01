"use client";
import { useEffect, useState } from "react";

interface PositionMap {
  id: number;
  sport: string;
  display_type: string;
  ics_position: string;
  short_label: string;
  display_order: number;
}

const DEFAULT_KEY = "*";
const DEFAULT_LABEL = "Default";



const CATEGORIES: { key: string; sport: string; display_type: string; label: string }[] = [
  { key: "default-broadcast",    sport: "*",                  display_type: "broadcast", label: "Default Broadcast" },
  { key: "default-bigscreen",    sport: "*",                  display_type: "bigscreen", label: "Default Big Screen" },
  { key: "football-bigscreen",   sport: "Football",           display_type: "bigscreen", label: "Football Big Screen" },
  { key: "baseball-broadcast",   sport: "Baseball",           display_type: "broadcast", label: "Baseball Broadcast" },
  { key: "baseball-bigscreen",   sport: "Baseball",           display_type: "bigscreen", label: "Baseball Big Screen" },
  { key: "softball-broadcast",   sport: "Softball",           display_type: "broadcast", label: "Softball Broadcast" },
  { key: "softball-bigscreen",   sport: "Softball",           display_type: "bigscreen", label: "Softball Big Screen" },
  { key: "mbb-broadcast",        sport: "Men's Basketball",   display_type: "broadcast", label: "Men's Basketball Broadcast" },
  { key: "mbb-bigscreen",        sport: "Men's Basketball",   display_type: "bigscreen", label: "Men's Basketball Big Screen" },
  { key: "wbb-broadcast",        sport: "Women's Basketball", display_type: "broadcast", label: "Women's Basketball Broadcast" },
  { key: "wbb-bigscreen",        sport: "Women's Basketball", display_type: "bigscreen", label: "Women's Basketball Big Screen" },
  { key: "volleyball-broadcast", sport: "Volleyball",         display_type: "broadcast", label: "Volleyball Broadcast" },
  { key: "volleyball-bigscreen", sport: "Volleyball",         display_type: "bigscreen", label: "Volleyball Big Screen" },
  { key: "soccer-broadcast",     sport: "Soccer",             display_type: "broadcast", label: "Soccer Broadcast" },
  { key: "soccer-bigscreen",     sport: "Soccer",             display_type: "bigscreen", label: "Soccer Big Screen" },
];

function sportLabel(s: string) { return s === DEFAULT_KEY ? DEFAULT_LABEL : s; }
function typeLabel(t: string)  { return t === "bigscreen" ? "Big Screen" : "Broadcast"; }

export default function PositionsPage() {
    const [usedPositions, setUsedPositions] = useState<{ sport: string; department: string; position: string }[]>([]);

  useEffect(() => {
    fetch("/api/positions-used").then(r => r.json()).then(setUsedPositions);
  }, []);
  const [rows, setRows] = useState<PositionMap[]>([]);
  const [category, setCategory] = useState<string>("default-broadcast");
  const [newRow, setNewRow] = useState({ ics_position: "", short_label: "" });
  const [flashing, setFlashing] = useState<number | null>(null);

  const cat = CATEGORIES.find(c => c.key === category)!;

  const load = async () => {
    const res = await fetch("/api/position-map");
    setRows(await res.json());
  };

  useEffect(() => { load(); }, []);

  const save = async (row: Partial<PositionMap>) => {
    await fetch("/api/position-map", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(row),
    });
    load();
  };

  const del = async (id: number) => {
    if (!confirm("Delete this position mapping?")) return;
    await fetch("/api/position-map", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  };

  const addNew = async () => {
    if (!newRow.ics_position || !newRow.short_label) {
      alert("ICS Position and Short Label are required");
      return;
    }
    const maxOrder = filtered.reduce((m, r) => Math.max(m, r.display_order), 0);
    await save({
      sport: cat.sport,
      display_type: cat.display_type,
      ics_position: newRow.ics_position,
      short_label: newRow.short_label,
      display_order: maxOrder + 10,
    });
    setNewRow({ ics_position: "", short_label: "" });
  };

  const filtered = rows
    .filter(r => r.sport === cat.sport && r.display_type === cat.display_type)
    .sort((a, b) => a.display_order - b.display_order);

  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= filtered.length) return;
    const a = filtered[index];
    const b = filtered[target];

    // Optimistic local swap
    const newRows = [...rows];
    const ai = newRows.findIndex(r => r.id === a.id);
    const bi = newRows.findIndex(r => r.id === b.id);
    newRows[ai] = { ...a, display_order: b.display_order };
    newRows[bi] = { ...b, display_order: a.display_order };
    setRows(newRows);
    setFlashing(a.id);
    setTimeout(() => setFlashing(null), 300);

    await fetch("/api/position-map", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orders: [
          { id: a.id, display_order: b.display_order },
          { id: b.id, display_order: a.display_order },
        ],
      }),
    });
    load();
  };



  const currentDeptLabel = cat.display_type === "bigscreen" ? "Big Screen" : "Broadcast";
  const usedInCategory = usedPositions
    .filter(u => u.sport === cat.sport && u.department === currentDeptLabel)
    .map(u => u.position);
  const mappedIcsPositions = new Set(filtered.map(f => f.ics_position));
  const unmapped = usedInCategory.filter(p => !mappedIcsPositions.has(p));



  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Position Labels</h1>
      <p className="text-gray-400 text-sm mb-4">
        Maps ICS position names to short labels. <strong>Default</strong> rows apply to every sport;
        sport-specific rows override Default for that sport only. Use the arrows to reorder.
      </p>

      <div className="mb-4">
        <select value={category} onChange={e => setCategory(e.target.value)}
          className="bg-gray-800 px-3 py-2 rounded text-base">
          {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
      </div>

      {cat.sport !== DEFAULT_KEY && (
        <div className="mb-3">
            <button
            onClick={async () => {
                if (!confirm(`Copy all Default ${typeLabel(cat.display_type)} positions into "${cat.label}"? Existing rows will be kept.`)) return;
                const res = await fetch("/api/position-map/copy-defaults", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sport: cat.sport, display_type: cat.display_type }),
                });
                const data = await res.json();
                alert(data.ok ? `Copied ${data.copied} positions.` : `Error: ${data.error}`);
                load();
            }}
            className="px-3 py-1 bg-purple-700 rounded hover:bg-purple-800 text-sm"
            >
            Copy from Default {typeLabel(cat.display_type)}
            </button>
        </div>
        )}
      {unmapped.length > 0 && (
        <div className="mb-3 bg-yellow-950/40 border border-yellow-800 rounded p-3 text-sm">
          <div className="font-semibold text-yellow-300 mb-1">
            ⚠ {unmapped.length} unmapped position{unmapped.length > 1 ? "s" : ""} used in imported shifts:
          </div>
          <div className="flex flex-wrap gap-2">
            {unmapped.map(p => (
              <button
                key={p}
                onClick={() => setNewRow({ ics_position: p, short_label: "" })}
                className="px-2 py-1 bg-yellow-900/50 hover:bg-yellow-900 rounded text-xs font-mono"
                title="Click to prefill the Add row"
              >
                {p}
              </button>
            ))}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            These positions appear in shifts but have no label mapping — they display with raw names. Click one to prefill.
          </div>
        </div>
      )}
      <table className="w-full bg-gray-900 rounded overflow-hidden text-sm">
        <thead className="bg-gray-800 text-left">
          <tr>
            <th className="px-2 py-1 w-16">Order</th>
            <th className="px-2 py-1">ICS Position</th>
            <th className="px-2 py-1">Short Label</th>
            <th className="px-2 py-1 w-28"></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((r, i) => (
            <EditableRow
              key={r.id}
              row={r}
              index={i}
              total={filtered.length}
              flashing={flashing === r.id}
              onMove={move}
              onSave={save}
              onDelete={del}
            />
          ))}
          {filtered.length === 0 && (
            <tr><td colSpan={4} className="px-2 py-3 text-gray-500 text-center">No mappings yet — add one below.</td></tr>
          )}

          <tr className="border-t-2 border-blue-800 bg-gray-950">
            <td className="px-2 py-1 text-center text-gray-500">new</td>
            <td className="px-2 py-1">
              <input value={newRow.ics_position}
                onChange={e => setNewRow({ ...newRow, ics_position: e.target.value })}
                placeholder="e.g. Assistant Director"
                className="bg-gray-800 px-2 py-1 rounded w-full" />
            </td>
            <td className="px-2 py-1">
              <input value={newRow.short_label}
                onChange={e => setNewRow({ ...newRow, short_label: e.target.value })}
                placeholder="e.g. AD"
                className="bg-gray-800 px-2 py-1 rounded w-full" />
            </td>
            <td className="px-2 py-1">
              <button onClick={addNew}
                className="px-3 py-1 bg-green-600 rounded hover:bg-green-700 w-full text-sm">Add</button>
            </td>
          </tr>
        </tbody>
      </table>

      <p className="text-xs text-gray-500 mt-3">
        Editing: <strong>{sportLabel(cat.sport)}</strong> — <strong>{typeLabel(cat.display_type)}</strong>
      </p>
    </div>
  );
}

function EditableRow({
  row, index, total, flashing, onMove, onSave, onDelete,
}: {
  row: PositionMap;
  index: number;
  total: number;
  flashing: boolean;
  onMove: (index: number, dir: -1 | 1) => void;
  onSave: (r: Partial<PositionMap>) => void;
  onDelete: (id: number) => void;
}) {
  const [label, setLabel] = useState(row.short_label);
  const dirty = label !== row.short_label;

  useEffect(() => { setLabel(row.short_label); }, [row.short_label]);

  return (
    <tr className={`border-t border-gray-800 transition-colors duration-300 ${flashing ? "bg-blue-950" : ""}`}>
      <td className="px-2 py-1">
        <div className="flex gap-1">
          <button
            onClick={() => onMove(index, -1)}
            disabled={index === 0}
            className="w-6 h-6 flex items-center justify-center bg-gray-800 rounded hover:bg-gray-700 disabled:opacity-20 disabled:cursor-not-allowed"
            aria-label="Move up"
          >▲</button>
          <button
            onClick={() => onMove(index, 1)}
            disabled={index === total - 1}
            className="w-6 h-6 flex items-center justify-center bg-gray-800 rounded hover:bg-gray-700 disabled:opacity-20 disabled:cursor-not-allowed"
            aria-label="Move down"
          >▼</button>
        </div>
      </td>
      <td className="px-2 py-1 font-mono text-gray-400">{row.ics_position}</td>
      <td className="px-2 py-1">
        <input value={label}
          onChange={e => setLabel(e.target.value)}
          className="bg-gray-800 px-2 py-1 rounded w-full" />
      </td>
      <td className="px-2 py-1 flex gap-1">
        <button disabled={!dirty}
          onClick={() => onSave({ ...row, short_label: label })}
          className="px-2 py-0.5 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-30 text-xs">Save</button>
        <button onClick={() => onDelete(row.id)}
          className="px-2 py-0.5 bg-red-700 rounded hover:bg-red-800 text-xs">✕</button>
      </td>
    </tr>
  );
}