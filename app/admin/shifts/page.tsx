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

const SPORTS = [
  "Football",
  "Baseball",
  "Softball",
  "Men's Basketball",
  "Women's Basketball",
  "Volleyball",
  "Soccer",
];

const DEPTS = [
  "Broadcast",
  "Big Screen",
  "Engineering",
  "Post-Production",
];

export default function ShiftsPage() {
  const [rows, setRows] = useState<Shift[]>([]);
  const [sport, setSport] = useState("");
  const [dept, setDept] = useState("");
  const [date, setDate] = useState("");
  const [seedOnly, setSeedOnly] = useState(false);
  const [sortAsc, setSortAsc] = useState(true);

  const load = () => {
    const params = new URLSearchParams();

    if (sport) params.set("sport", sport);
    if (dept) params.set("department", dept);
    if (date) params.set("date", date);
    if (seedOnly) params.set("seed", "1");

    fetch(`/api/shifts?${params}`)
      .then((r) => r.json())
      .then(setRows);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sport, dept, date, seedOnly]);

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("en-US", {
      timeZone: "America/Chicago",
      month: "numeric",
      day: "numeric",
      year: "2-digit",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  const sortedRows = [...rows].sort((a, b) => {
    const aTime = new Date(a.dtstart).getTime();
    const bTime = new Date(b.dtstart).getTime();

    return sortAsc ? aTime - bTime : bTime - aTime;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e7e5e2] font-sans">
      {/* =========================================================
          TOP ACCENT
      ========================================================= */}
      <div className="h-1 w-full bg-[#500000]" />

      <div className="max-w-[1800px] mx-auto px-6 md:px-8 py-8">

        {/* =======================================================
            HEADER
        ======================================================= */}
        <div className="flex items-end justify-between mb-7">
          <div>
            <h1 className="amdb-display text-3xl md:text-4xl font-semibold tracking-tight text-[#e7e5e2]">
              Shifts
            </h1>

            <div className="amdb-mono text-xs text-[#6b6b70] mt-1">
              {rows.length} {rows.length === 1 ? "row" : "rows"}
            </div>
          </div>

          <button
            onClick={() => setSortAsc((prev) => !prev)}
            className="
              amdb-mono
              px-3 py-2
              bg-[#111113]
              border border-[#2c2c30]
              rounded-sm
              text-xs
              uppercase
              tracking-wide
              text-[#b9b7b3]
              hover:bg-[#18181b]
              hover:border-[#7a1f1f]
              transition
            "
          >
            {sortAsc ? "↑ Earliest first" : "↓ Latest first"}
          </button>
        </div>

        {/* =======================================================
            FILTER BAR
        ======================================================= */}
        <div className="bg-[#111113] border border-[#232326] rounded-sm p-3 mb-5">
          <div className="flex flex-wrap gap-2">

            {/* Sport */}
            <select
              value={sport}
              onChange={(e) => setSport(e.target.value)}
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
              <option value="">All sports</option>

              {SPORTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {/* Department */}
            <select
              value={dept}
              onChange={(e) => setDept(e.target.value)}
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
              <option value="">All departments</option>

              {DEPTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            {/* Date */}
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
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
            />

            {/* Seed */}
            <label
              className="
                flex
                items-center
                gap-2
                px-3
                py-2
                bg-[#0a0a0a]
                border border-[#2c2c30]
                rounded-sm
                amdb-mono
                text-xs
                text-[#8f8f94]
                cursor-pointer
              "
            >
              <input
                type="checkbox"
                checked={seedOnly}
                onChange={(e) => setSeedOnly(e.target.checked)}
                className="accent-[#7a1f1f]"
              />

              <span>Seed only</span>
            </label>

            {/* Clear */}
            <button
              onClick={() => {
                setSport("");
                setDept("");
                setDate("");
                setSeedOnly(false);
              }}
              className="
                amdb-mono
                px-3 py-2
                bg-[#18181b]
                border border-[#2c2c30]
                rounded-sm
                text-xs
                uppercase
                tracking-wide
                text-[#8f8f94]
                hover:text-[#d8d6d3]
                hover:border-[#7a1f1f]
                transition
              "
            >
              Clear
            </button>
          </div>
        </div>

        {/* =======================================================
            SHIFT TABLE
        ======================================================= */}
        <div className="bg-[#111113] border border-[#232326] rounded-sm overflow-hidden">

          {/* Table header */}
          <div className="px-4 py-2 bg-[#18181b] border-b border-[#232326] flex items-center justify-between">
            <div className="amdb-mono text-[10px] uppercase tracking-[0.25em] text-[#6b6b70]">
              Production Schedule
            </div>

            <div className="amdb-mono text-[10px] uppercase tracking-widest text-[#47474d]">
              {sortAsc ? "Chronological" : "Reverse chronological"}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#0d0d0f] border-b border-[#2c2c30] text-left">
                  <th className="px-4 py-3 amdb-mono text-[10px] uppercase tracking-widest text-[#6b6b70]">
                    Start
                  </th>

                  <th className="px-4 py-3 amdb-mono text-[10px] uppercase tracking-widest text-[#6b6b70]">
                    End
                  </th>

                  <th className="px-4 py-3 amdb-mono text-[10px] uppercase tracking-widest text-[#6b6b70]">
                    Sport
                  </th>

                  <th className="px-4 py-3 amdb-mono text-[10px] uppercase tracking-widest text-[#6b6b70]">
                    Dept
                  </th>

                  <th className="px-4 py-3 amdb-mono text-[10px] uppercase tracking-widest text-[#6b6b70]">
                    Position
                  </th>

                  <th className="px-4 py-3 amdb-mono text-[10px] uppercase tracking-widest text-[#6b6b70]">
                    Employee
                  </th>

                  <th className="px-4 py-3 amdb-mono text-[10px] uppercase tracking-widest text-[#47474d]">
                    UID
                  </th>
                </tr>
              </thead>

              <tbody>
                {sortedRows.map((r) => (
                  <tr
                    key={r.uid}
                    className={`
                      border-b border-[#232326]
                      transition-colors
                      hover:bg-[#18181b]
                      ${
                        r.uid.startsWith("SEED-")
                          ? "bg-[#241c0d]"
                          : "bg-[#111113]"
                      }
                    `}
                  >
                    <td className="px-4 py-2.5 whitespace-nowrap text-[#d8d6d3]">
                      {fmt(r.dtstart)}
                    </td>

                    <td className="px-4 py-2.5 whitespace-nowrap text-[#a7a9ac]">
                      {fmt(r.dtend)}
                    </td>

                    <td className="px-4 py-2.5 text-[#e7e5e2] font-medium">
                      {r.sport}
                    </td>

                    <td className="px-4 py-2.5 text-[#8f8f94]">
                      {r.department}
                    </td>

                    <td className="px-4 py-2.5 text-[#b9b7b3]">
                      {r.position}
                    </td>

                    <td className="px-4 py-2.5 text-[#e7e5e2] font-medium">
                      {r.employee_name}
                    </td>

                    <td className="px-4 py-2.5 font-mono text-[#47474d] whitespace-nowrap">
                      {r.uid}
                    </td>
                  </tr>
                ))}

                {sortedRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="
                        px-4
                        py-12
                        text-center
                        amdb-mono
                        text-[10px]
                        uppercase
                        tracking-[0.2em]
                        text-[#47474d]
                      "
                    >
                      No shifts match filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* =======================================================
            FOOTER
        ======================================================= */}
        <div className="mt-3 flex justify-between items-center">
          <div className="amdb-mono text-[9px] uppercase tracking-[0.2em] text-[#3f3f44]">
            12th Man Productions
          </div>

          <div className="amdb-mono text-[9px] uppercase tracking-[0.2em] text-[#3f3f44]">
            Shift Database
          </div>
        </div>
      </div>

      {/* Bottom accent */}
      <div className="h-1 w-full bg-[#500000]" />
    </div>
  );
}
