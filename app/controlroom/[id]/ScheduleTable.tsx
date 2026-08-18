"use client";

import { useEffect, useState } from "react";
import type { ScheduleRow } from "@/lib/display-state";

export default function ScheduleTable({ rows }: { rows: ScheduleRow[] }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  /* Find active row: latest row whose startTime <= now
  let activeIndex = -1;
  for (let i = 0; i < rows.length; i++) {
    const st = rows[i].startTime;
    if (st && new Date(st).getTime() <= now) {
      activeIndex = i;
    }
  }
*/

  // Find active row: latest row whose startTime <= now, default to 0
    let activeIndex = rows.length > 0 ? 0 : -1;
    for (let i = 0; i < rows.length; i++) {
    const st = rows[i].startTime;
    if (st && new Date(st).getTime() <= now) {
        activeIndex = i;
    }
    }

  return (
    <table className="w-full schedule-text font-bold">
      <tbody>
        {rows.map((s, i) => {
          const isActive = i === activeIndex;
          return (
            <tr
              key={i}
              className={`border-b border-[#2b2b2b] last:border-b-0 ${
                isActive ? "bg-[#500000]" : "bg-[#101010]"
              }`}
            >
              <td
                className={`schedule-cell uppercase tracking-wide w-1/2 ${
                  isActive ? "text-white" : "text-[#c9cbcd]"
                }`}
              >
                {s.label}
              </td>
              <td
                className={`schedule-cell text-right ${
                  isActive ? "text-white" : "text-[#ffd21a]"
                }`}
              >
                {s.time || <span className="text-[#777]">TBD</span>}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}