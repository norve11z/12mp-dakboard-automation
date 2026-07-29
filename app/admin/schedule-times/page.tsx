"use client";
import { useEffect, useState } from "react";

interface TemplateRow {
  id: number;
  sport: string;
  display_type: string;
  label: string;
  ref: string;
  offset_minutes: number;
}

const CATEGORIES: { key: string; sport: string; display_type: string; label: string }[] = [
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

const REFS = [
  { value: "crew_call", label: "Crew Call" },
  { value: "game_time", label: "Game Time" },
];

function minutesToHMM(mins: number): string {
  const sign = mins < 0 ? "-" : "+";
  const abs = Math.abs(mins);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sign}${h}:${String(m).padStart(2, "0")}`;
}

function hmmToMinutes(s: string): number | null {
  const m = s.trim().match(/^([+-]?)(\d+):(\d{1,2})$/);
  if (!m) return null;
  const sign = m[1] === "-" ? -1 : 1;
  return sign * (parseInt(m[2], 10) * 60 + parseInt(m[3], 10));
}

export default function ScheduleTimesPage() {
  const [rows, setRows] = useState<TemplateRow[]>([]);
  const [category, setCategory] = useState<string>("football-bigscreen");
  const [copyFrom, setCopyFrom] = useState<string>("");
  const [newRow, setNewRow] = useState({ label: "", ref: "crew_call", offset: "+0:00" });

  const cat = CATEGORIES.find(c => c.key === category)!;

  const load = async () => {
    const res = await fetch("/api/schedule-template");
    setRows(await res.json());
  };
  useEffect(() => { load(); }, []);

  const filtered = rows
    .filter(r => r.sport === cat.sport && r.display_type === cat.display_type)
    .sort((a, b) => {
      if (a.ref !== b.ref) return a.ref === "crew_call" ? -1 : 1;
      return a.offset_minutes - b.offset_minutes;
    });

  const save = async (row: Partial<TemplateRow>) => {
    await fetch("/api/schedule-template", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(row),
    });
    load();
  };

  const del = async (id: number) => {
    if (!confirm("Delete this row?")) return;
    await fetch("/api/schedule-template", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  };

  const addNew = async () => {
    const mins = hmmToMinutes(newRow.offset);
    if (!newRow.label || mins === null) {
      alert("Label and offset (e.g. +1:30 or -0:45) required");
      return;
    }
    await save({
      sport: cat.sport,
      display_type: cat.display_type,
      label: newRow.label,
      ref: newRow.ref,
      offset_minutes: mins,
    });
    setNewRow({ label: "", ref: "crew_call", offset: "+0:00" });
  };

  const doCopy = async () => {
    if (!copyFrom) return;
    const from = CATEGORIES.find(c => c.key === copyFrom);
    if (!from) return;
    if (!confirm(`Copy all rows from "${from.label}" into "${cat.label}"?`)) return;
    await fetch("/api/schedule-template/copy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from_sport: from.sport,
        from_display_type: from.display_type,
        to_sport: cat.sport,
        to_display_type: cat.display_type,
      }),
    });
    load();
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Schedule Times</h1>
      <p className="text-gray-400 text-sm mb-4">
        Rows are anchored to either <strong>Crew Call</strong> (earliest ICS shift start) or{" "}
        <strong>Game Time</strong> (ESPN/manual). Offsets are signed durations
        (e.g. <code>+2:30</code>, <code>-1:15</code>).
      </p>

      <div className="flex gap-3 mb-4 items-center flex-wrap">
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="bg-gray-800 px-3 py-2 rounded text-base"
        >
          {CATEGORIES.map(c => (
            <option key={c.key} value={c.key}>{c.label}</option>
          ))}
        </select>

        <select
          value={copyFrom}
          onChange={e => setCopyFrom(e.target.value)}
          className="bg-gray-800 px-3 py-2 rounded text-sm"
        >
          <option value="">Copy from…</option>
          {CATEGORIES.filter(c => c.key !== category).map(c => (
            <option key={c.key} value={c.key}>{c.label}</option>
          ))}
        </select>

        <button
          onClick={doCopy}
          disabled={!copyFrom}
          className="px-3 py-2 bg-purple-700 rounded hover:bg-purple-800 text-sm disabled:opacity-40"
        >
          Copy
        </button>
      </div>

      <table className="w-full bg-gray-900 rounded overflow-hidden text-sm">
        <thead className="bg-gray-800 text-left">
          <tr>
            <th className="px-2 py-1">Label</th>
            <th className="px-2 py-1 w-40">Anchor</th>
            <th className="px-2 py-1 w-32">Offset</th>
            <th className="px-2 py-1 w-28"></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(r => (
            <EditableRow key={r.id} row={r} onSave={save} onDelete={del} />
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={4} className="px-2 py-3 text-gray-500 text-center">
                No rows yet — add one below.
              </td>
            </tr>
          )}

          <tr className="border-t-2 border-blue-800 bg-gray-950">
            <td className="px-2 py-1">
              <input
                value={newRow.label}
                onChange={e => setNewRow({ ...newRow, label: e.target.value })}
                placeholder="e.g. Crew Call"
                className="bg-gray-800 px-2 py-1 rounded w-full"
              />
            </td>
            <td className="px-2 py-1">
              <select
                value={newRow.ref}
                onChange={e => setNewRow({ ...newRow, ref: e.target.value })}
                className="bg-gray-800 px-2 py-1 rounded w-full"
              >
                {REFS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </td>
            <td className="px-2 py-1">
              <input
                value={newRow.offset}
                onChange={e => setNewRow({ ...newRow, offset: e.target.value })}
                placeholder="+0:00"
                className="bg-gray-800 px-2 py-1 rounded w-full font-mono"
              />
            </td>
            <td className="px-2 py-1">
              <button
                onClick={addNew}
                className="px-3 py-1 bg-green-600 rounded hover:bg-green-700 w-full text-sm"
              >
                Add
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <p className="text-xs text-gray-500 mt-3">
        Editing: <strong>{cat.label}</strong>. Rows sort by anchor (Crew Call first) then by offset.
      </p>
    </div>
  );
}

function EditableRow({
  row,
  onSave,
  onDelete,
}: {
  row: TemplateRow;
  onSave: (r: Partial<TemplateRow>) => void;
  onDelete: (id: number) => void;
}) {
  const [label, setLabel] = useState(row.label);
  const [ref, setRef] = useState(row.ref);
  const [offset, setOffset] = useState(minutesToHMM(row.offset_minutes));

  useEffect(() => {
    setLabel(row.label);
    setRef(row.ref);
    setOffset(minutesToHMM(row.offset_minutes));
  }, [row]);

  const dirty =
    label !== row.label ||
    ref !== row.ref ||
    offset !== minutesToHMM(row.offset_minutes);

  const doSave = () => {
    const mins = hmmToMinutes(offset);
    if (!label || mins === null) {
      alert("Invalid label or offset");
      return;
    }
    onSave({ ...row, label, ref, offset_minutes: mins });
  };

  return (
    <tr className="border-t border-gray-800">
      <td className="px-2 py-1">
        <input
          value={label}
          onChange={e => setLabel(e.target.value)}
          className="bg-gray-800 px-2 py-1 rounded w-full"
        />
      </td>
      <td className="px-2 py-1">
        <select
          value={ref}
          onChange={e => setRef(e.target.value)}
          className="bg-gray-800 px-2 py-1 rounded w-full"
        >
          {REFS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </td>
      <td className="px-2 py-1">
        <input
          value={offset}
          onChange={e => setOffset(e.target.value)}
          className="bg-gray-800 px-2 py-1 rounded w-full font-mono"
        />
      </td>
      <td className="px-2 py-1 flex gap-1">
        <button
          disabled={!dirty}
          onClick={doSave}
          className="px-2 py-0.5 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-30 text-xs"
        >
          Save
        </button>
        <button
          onClick={() => onDelete(row.id)}
          className="px-2 py-0.5 bg-red-700 rounded hover:bg-red-800 text-xs"
        >
          ✕
        </button>
      </td>
    </tr>
  );
}