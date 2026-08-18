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
  */
  let activeIndex = -1;
  for (let i = 0; i < rows.length; i++) {
    const st = rows[i].startTime;
    if (st && new Date(st).getTime() <= now) {
      activeIndex = i;
    }
  }

  // highlights first row (for testing)
  /*
  let activeIndex = rows.length > 0 ? 0 : -1;
  for (let i = 0; i < rows.length; i++) {
    const st = rows[i].startTime;
    if (st && new Date(st).getTime() <= now) {
        activeIndex = i;
    }
}
*/

/*
possible game schedule highlight colors:
intiial light maroon:               isActive ? "bg-[#500000]" : "bg-[#101010]"
faded yellow/gold:                  isActive ? "bg-[#1a1600] border-l-4 border-[#ffd21a]" : "bg-[#101010]"
light grey:                         isActive ? "bg-[#1f1f1f]" : "bg-[#101010]"
darker maroon:                      isActive ? "bg-[#2a0808]" : "bg-[#101010]"
just left gold vertical bar:        isActive ? "bg-[#101010] border-l-4 border-[#ffd21a]" : "bg-[#101010]"
dark maroon with red bar:           isActive ? "bg-[#1a0505] border-l-4 border-[#ff4d3d]" : "bg-[#101010]"
bright red:                         isActive ? "bg-[#8b0000]" : "bg-[#101010]"

*/

  return (
    <table className="w-full schedule-text font-bold">
      <tbody>
        {rows.map((s, i) => {
          const isActive = i === activeIndex;
          return (
            <tr
              key={i}
              className={`border-b border-[#2b2b2b] last:border-b-0 ${

                isActive ? "bg-[#1f1f1f]" : "bg-[#101010]"

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