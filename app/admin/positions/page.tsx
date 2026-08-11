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
  <div className="min-h-screen bg-[#0a0a0a] text-[#e7e5e2] font-sans">
    <div className="h-1 w-full bg-[#500000]" />

    <div className="max-w-[1800px] mx-auto px-6 md:px-8 py-8">
      {/* Header */}
      <div className="mb-7">
        <h1 className="amdb-display text-3xl md:text-4xl font-semibold tracking-tight text-[#e7e5e2]">
          Position Labels
        </h1>

        <p className="amdb-mono text-xs text-[#6b6b70] mt-2 max-w-3xl leading-relaxed">
          Maps ICS position names to short labels. Default rows apply to every
          sport; sport-specific rows override Default for that sport only.
          Use the arrows to reorder.
        </p>
      </div>

      {/* Category selector */}
      <div className="bg-[#111113] border border-[#232326] rounded-sm p-3 mb-5">
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
      </div>

      {/* Copy defaults */}
      {cat.sport !== DEFAULT_KEY && (
        <div className="mb-4">
          <button
            onClick={async () => {
              if (
                !confirm(
                  `Copy all Default ${typeLabel(
                    cat.display_type
                  )} positions into "${cat.label}"? Existing rows will be kept.`
                )
              )
                return;

              const res = await fetch("/api/position-map/copy-defaults", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  sport: cat.sport,
                  display_type: cat.display_type,
                }),
              });

              const data = await res.json();

              alert(
                data.ok
                  ? `Copied ${data.copied} positions.`
                  : `Error: ${data.error}`
              );

              load();
            }}
            className="
              amdb-mono
              px-3 py-2
              bg-[#18181b]
              border border-[#2c2c30]
              rounded-sm
              hover:bg-[#242428]
              hover:border-[#7a1f1f]
              text-xs
              uppercase
              tracking-wide
              text-[#b9b7b3]
              transition
            "
          >
            Copy from Default {typeLabel(cat.display_type)}
          </button>
        </div>
      )}

      {/* Unmapped positions */}
      {unmapped.length > 0 && (
        <div className="mb-5 bg-[#241c0d] border border-[#66500f] rounded-sm p-4">
          <div className="amdb-mono text-xs font-semibold uppercase tracking-wide text-[#d6b84a] mb-2">
            ⚠ {unmapped.length} unmapped position
            {unmapped.length > 1 ? "s" : ""} used in imported shifts
          </div>

          <div className="flex flex-wrap gap-2">
            {unmapped.map(p => (
              <button
                key={p}
                onClick={() =>
                  setNewRow({
                    ics_position: p,
                    short_label: "",
                  })
                }
                className="
                  amdb-mono
                  px-2 py-1.5
                  bg-[#30260f]
                  border border-[#66500f]
                  hover:bg-[#3d3011]
                  rounded-sm
                  text-[10px]
                  text-[#d6b84a]
                  transition
                "
                title="Click to prefill the Add row"
              >
                {p}
              </button>
            ))}
          </div>

          <div className="amdb-mono text-[9px] text-[#7d7252] mt-3 uppercase tracking-wide">
            These positions appear in shifts but have no label mapping.
            They display with raw names. Click one to prefill.
          </div>
        </div>
      )}

      {/* Position table */}
      <div className="bg-[#111113] border border-[#232326] rounded-sm overflow-hidden">
        <div className="px-4 py-2 bg-[#18181b] border-b border-[#232326] flex items-center justify-between">
          <div className="amdb-mono text-[10px] uppercase tracking-[0.25em] text-[#6b6b70]">
            Position Mapping
          </div>

          <div className="amdb-mono text-[10px] uppercase tracking-widest text-[#47474d]">
            {sportLabel(cat.sport)} · {typeLabel(cat.display_type)}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-[#0d0d0f] text-left border-b border-[#2c2c30]">
              <tr>
                <th className="px-4 py-3 w-20 amdb-mono text-[10px] uppercase tracking-widest text-[#6b6b70]">
                  Order
                </th>

                <th className="px-4 py-3 amdb-mono text-[10px] uppercase tracking-widest text-[#6b6b70]">
                  ICS Position
                </th>

                <th className="px-4 py-3 amdb-mono text-[10px] uppercase tracking-widest text-[#6b6b70]">
                  Short Label
                </th>

                <th className="px-4 py-3 w-32" />
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
                    No mappings yet — add one below.
                  </td>
                </tr>
              )}

              {/* Add row */}
              <tr className="border-t border-[#500000] bg-[#0d0d0f]">
                <td className="px-4 py-3 text-center">
                  <span className="amdb-mono text-[10px] uppercase tracking-wide text-[#47474d]">
                    New
                  </span>
                </td>

                <td className="px-4 py-3">
                  <input
                    value={newRow.ics_position}
                    onChange={e =>
                      setNewRow({
                        ...newRow,
                        ics_position: e.target.value,
                      })
                    }
                    placeholder="e.g. Assistant Director"
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
                  <input
                    value={newRow.short_label}
                    onChange={e =>
                      setNewRow({
                        ...newRow,
                        short_label: e.target.value,
                      })
                    }
                    placeholder="e.g. AD"
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
                      hover:bg-[#681010]
                      w-full
                      text-xs
                      uppercase
                      tracking-wide
                      text-[#f0eeee]
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

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between">
        <p className="amdb-mono text-[9px] uppercase tracking-[0.2em] text-[#3f3f44]">
          Editing: {sportLabel(cat.sport)} — {typeLabel(cat.display_type)}
        </p>

        <p className="amdb-mono text-[9px] uppercase tracking-[0.2em] text-[#3f3f44]">
          Position Mapping
        </p>
      </div>
    </div>

    <div className="h-1 w-full bg-[#500000]" />
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
  <tr
    className={`
      border-t border-[#232326]
      transition-colors duration-300
      ${flashing ? "bg-[#241c0d]" : "bg-[#111113]"}
      hover:bg-[#18181b]
    `}
  >
    <td className="px-4 py-2.5">
      <div className="flex items-center justify-center gap-1">
        <button
          onClick={() => onMove(index, -1)}
          disabled={index === 0}
          className="
            w-6 h-6
            flex items-center justify-center
            bg-[#0a0a0a]
            border border-[#2c2c30]
            rounded-sm
            hover:bg-[#242428]
            hover:border-[#7a1f1f]
            disabled:opacity-20
            disabled:cursor-not-allowed
            text-[9px]
            text-[#a7a9ac]
            transition
          "
          aria-label="Move up"
        >
          ▲
        </button>

        <button
          onClick={() => onMove(index, 1)}
          disabled={index === total - 1}
          className="
            w-6 h-6
            flex items-center justify-center
            bg-[#0a0a0a]
            border border-[#2c2c30]
            rounded-sm
            hover:bg-[#242428]
            hover:border-[#7a1f1f]
            disabled:opacity-20
            disabled:cursor-not-allowed
            text-[9px]
            text-[#a7a9ac]
            transition
          "
          aria-label="Move down"
        >
          ▼
        </button>
      </div>
    </td>

    <td className="px-4 py-2.5">
      <div className="amdb-mono text-xs text-[#d8d6d3]">
        {row.ics_position}
      </div>
    </td>

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
      <div className="flex gap-1">
        <button
          disabled={!dirty}
          onClick={() =>
            onSave({
              ...row,
              short_label: label,
            })
          }
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