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
  <div className="min-h-screen bg-[#0a0a0a] text-[#e7e5e2] font-sans">
    <div className="h-1 w-full bg-[#500000]" />

    <div className="max-w-[1800px] mx-auto px-6 md:px-8 py-8">
      {/* Header */}
      <div className="mb-7">
        <h1 className="amdb-display text-3xl md:text-4xl font-semibold tracking-tight text-[#e7e5e2]">
          Schedule Times
        </h1>

        <p className="amdb-mono text-xs text-[#6b6b70] mt-2 max-w-3xl leading-relaxed">
          Rows are anchored to either{" "}
          <span className="text-[#a7a9ac]">Crew Call</span>{" "}
          (earliest ICS shift start) or{" "}
          <span className="text-[#a7a9ac]">Game Time</span>{" "}
          (ESPN/manual). Offsets are signed durations
          (e.g. +2:30, -1:15).
        </p>
      </div>

      {/* Controls */}
      <div className="bg-[#111113] border border-[#232326] rounded-sm p-3 mb-5">
        <div className="flex gap-2 items-center flex-wrap">
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
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
            {CATEGORIES.map(c => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>

          <select
            value={copyFrom}
            onChange={e => setCopyFrom(e.target.value)}
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
            <option value="">Copy from…</option>

            {CATEGORIES
              .filter(c => c.key !== category)
              .map(c => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
          </select>

          <button
            onClick={doCopy}
            disabled={!copyFrom}
            className="
              amdb-mono
              px-3 py-2
              bg-[#18181b]
              border border-[#2c2c30]
              rounded-sm
              text-xs
              uppercase
              tracking-wide
              text-[#b9b7b3]
              hover:bg-[#242428]
              hover:border-[#7a1f1f]
              transition
              disabled:opacity-40
              disabled:hover:border-[#2c2c30]
            "
          >
            Copy
          </button>
        </div>
      </div>

      {/* Schedule table */}
      <div className="bg-[#111113] border border-[#232326] rounded-sm overflow-hidden">
        <div className="px-4 py-2 bg-[#18181b] border-b border-[#232326] flex items-center justify-between">
          <div className="amdb-mono text-[10px] uppercase tracking-[0.25em] text-[#6b6b70]">
            Schedule Configuration
          </div>

          <div className="amdb-mono text-[10px] uppercase tracking-widest text-[#47474d]">
            {cat.label}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-[#0d0d0f] text-left border-b border-[#2c2c30]">
              <tr>
                <th className="px-4 py-3 amdb-mono text-[10px] uppercase tracking-widest text-[#6b6b70]">
                  Label
                </th>

                <th className="px-4 py-3 amdb-mono text-[10px] uppercase tracking-widest text-[#6b6b70] w-40">
                  Anchor
                </th>

                <th className="px-4 py-3 amdb-mono text-[10px] uppercase tracking-widest text-[#6b6b70] w-32">
                  Offset
                </th>

                <th className="px-4 py-3 w-28" />
              </tr>
            </thead>

            <tbody>
              {filtered.map(r => (
                <EditableRow
                  key={r.id}
                  row={r}
                  onSave={save}
                  onDelete={del}
                />
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
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
                    No rows yet — add one below.
                  </td>
                </tr>
              )}

              {/* Add row */}
              <tr className="border-t border-[#500000] bg-[#0d0d0f]">
                <td className="px-4 py-3">
                  <input
                    value={newRow.label}
                    onChange={e =>
                      setNewRow({
                        ...newRow,
                        label: e.target.value,
                      })
                    }
                    placeholder="e.g. Crew Call"
                    className="
                      amdb-mono
                      bg-[#0a0a0a]
                      border border-[#2c2c30]
                      px-3 py-2
                      rounded-sm
                      w-full
                      text-xs
                      text-[#d8d6d3]
                      placeholder:text-[#47474d]
                      focus:outline-none
                      focus:border-[#7a1f1f]
                    "
                  />
                </td>

                <td className="px-4 py-3">
                  <select
                    value={newRow.ref}
                    onChange={e =>
                      setNewRow({
                        ...newRow,
                        ref: e.target.value,
                      })
                    }
                    className="
                      amdb-mono
                      bg-[#0a0a0a]
                      border border-[#2c2c30]
                      px-3 py-2
                      rounded-sm
                      w-full
                      text-xs
                      text-[#d8d6d3]
                      focus:outline-none
                      focus:border-[#7a1f1f]
                    "
                  >
                    {REFS.map(r => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </td>

                <td className="px-4 py-3">
                  <input
                    value={newRow.offset}
                    onChange={e =>
                      setNewRow({
                        ...newRow,
                        offset: e.target.value,
                      })
                    }
                    placeholder="+0:00"
                    className="
                      amdb-mono
                      bg-[#0a0a0a]
                      border border-[#2c2c30]
                      px-3 py-2
                      rounded-sm
                      w-full
                      text-xs
                      text-[#d8d6d3]
                      placeholder:text-[#47474d]
                      focus:outline-none
                      focus:border-[#7a1f1f]
                    "
                  />
                </td>

                <td className="px-4 py-3">
                  <button
                    onClick={addNew}
                    className="
                      amdb-mono
                      px-3 py-2
                      bg-[#500000]
                      border border-[#6b1616]
                      rounded-sm
                      w-full
                      text-xs
                      uppercase
                      tracking-wide
                      text-[#f0eeee]
                      hover:bg-[#681010]
                      transition
                    "
                  >
                    Add
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer info */}
      <div className="mt-3 flex items-center justify-between">
        <p className="amdb-mono text-[9px] uppercase tracking-[0.2em] text-[#3f3f44]">
          Editing: {cat.label}
        </p>

        <p className="amdb-mono text-[9px] uppercase tracking-[0.2em] text-[#3f3f44]">
          Rows sort by anchor · then offset
        </p>
      </div>
    </div>

    <div className="h-1 w-full bg-[#500000]" />
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
  <tr className="border-t border-[#232326] bg-[#111113] hover:bg-[#18181b] transition-colors">
    <td className="px-4 py-2.5">
      <input
        value={label}
        onChange={e => setLabel(e.target.value)}
        className="
          amdb-mono
          bg-[#0a0a0a]
          border border-[#2c2c30]
          px-3 py-2
          rounded-sm
          w-full
          text-xs
          text-[#d8d6d3]
          focus:outline-none
          focus:border-[#7a1f1f]
        "
      />
    </td>

    <td className="px-4 py-2.5">
      <select
        value={ref}
        onChange={e => setRef(e.target.value)}
        className="
          amdb-mono
          bg-[#0a0a0a]
          border border-[#2c2c30]
          px-3 py-2
          rounded-sm
          w-full
          text-xs
          text-[#d8d6d3]
          focus:outline-none
          focus:border-[#7a1f1f]
        "
      >
        {REFS.map(r => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
    </td>

    <td className="px-4 py-2.5">
      <input
        value={offset}
        onChange={e => setOffset(e.target.value)}
        className="
          amdb-mono
          bg-[#0a0a0a]
          border border-[#2c2c30]
          px-3 py-2
          rounded-sm
          w-full
          text-xs
          text-[#d8d6d3]
          font-mono
          focus:outline-none
          focus:border-[#7a1f1f]
        "
      />
    </td>

    <td className="px-4 py-2.5">
      <div className="flex gap-1">
        <button
          disabled={!dirty}
          onClick={doSave}
          className="
            amdb-mono
            px-3 py-1.5
            bg-[#18181b]
            border border-[#2c2c30]
            rounded-sm
            hover:bg-[#242428]
            hover:border-[#7a1f1f]
            disabled:opacity-30
            text-[10px]
            uppercase
            tracking-wide
            text-[#b9b7b3]
            transition
          "
        >
          Save
        </button>

        <button
          onClick={() => onDelete(row.id)}
          className="
            amdb-mono
            px-2.5 py-1.5
            bg-[#300000]
            border border-[#500000]
            rounded-sm
            hover:bg-[#500000]
            text-[10px]
            text-[#c96060]
            transition
          "
        >
          ✕
        </button>
      </div>
    </td>
  </tr>
);

}