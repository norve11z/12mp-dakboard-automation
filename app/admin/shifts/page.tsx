"use client";
import { useEffect, useState } from "react";

interface Shift {
  uid: string;
  employee_name: string;
  position: string;
  sport: string;
  department: string;
  dtstart: string;
  dtend: string;
  imported_at: string;
}

const SPORTS = ["Football", "Baseball", "Softball", "Men's Basketball", "Women's Basketball", "Volleyball", "Soccer"];
const DEPTS = ["Broadcast", "Big Screen", "Engineering", "Post-Production"];

export default function ShiftsPage() {
  const [rows, setRows] = useState<Shift[]>([]);
  const [sport, setSport] = useState("");
  const [dept, setDept] = useState("");
  const [date, setDate] = useState("");
  const [seedOnly, setSeedOnly] = useState(false);

  const load = () => {
    const params = new URLSearchParams();
    if (sport) params.set("sport", sport);
    if (dept) params.set("department", dept);
    if (date) params.set("date", date);
    if (seedOnly) params.set("seed", "1");
    fetch(`/api/shifts?${params}`).then(r => r.json()).then(setRows);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [sport, dept, date, seedOnly]);

  const fmt = (iso: string) => new Date(iso).toLocaleString("en-US", {
    timeZone: "America/Chicago",
    month: "numeric", day: "numeric", year: "2-digit",
    hour: "numeric", minute: "2-digit", hour12: true,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Shifts (raw)</h1>
        <div className="text-sm text-gray-400">{rows.length} rows</div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4 bg-gray-900 border border-gray-800 rounded p-3 text-sm">
        <select value={sport} onChange={e => setSport(e.target.value)}
          className="bg-gray-800 px-2 py-1 rounded">
          <option value="">All sports</option>
          {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={dept} onChange={e => setDept(e.target.value)}
          className="bg-gray-800 px-2 py-1 rounded">
          <option value="">All departments</option>
          {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="bg-gray-800 px-2 py-1 rounded" />
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={seedOnly} onChange={e => setSeedOnly(e.target.checked)} />
          <span>Seed only</span>
        </label>
        <button onClick={() => { setSport(""); setDept(""); setDate(""); setSeedOnly(false); }}
          className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 text-xs">Clear</button>
      </div>

      <table className="w-full bg-gray-900 border border-gray-800 rounded overflow-hidden text-xs">
        <thead className="bg-gray-800 text-left">
          <tr>
            <th className="p-2">Start</th>
            <th className="p-2">End</th>
            <th className="p-2">Sport</th>
            <th className="p-2">Dept</th>
            <th className="p-2">Position</th>
            <th className="p-2">Employee</th>
            <th className="p-2 text-gray-500">UID</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.uid} className={`border-t border-gray-800 ${r.uid.startsWith("SEED-") ? "bg-yellow-950/20" : ""}`}>
              <td className="p-2 whitespace-nowrap">{fmt(r.dtstart)}</td>
              <td className="p-2 whitespace-nowrap">{fmt(r.dtend)}</td>
              <td className="p-2">{r.sport}</td>
              <td className="p-2 text-gray-400">{r.department}</td>
              <td className="p-2">{r.position}</td>
              <td className="p-2">{r.employee_name}</td>
              <td className="p-2 font-mono text-gray-500">{r.uid}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={7} className="p-4 text-center text-gray-500">No shifts match filters.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}