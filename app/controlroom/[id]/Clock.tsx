"use client";

import { useEffect, useState } from "react";
import { TZ } from "@/lib/tz";

function useClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const time = now.toLocaleTimeString("en-US", {
    timeZone: TZ,
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const day = now.toLocaleDateString("en-US", {
    timeZone: TZ,
    weekday: "long",
  });

  const date = now.toLocaleDateString("en-US", {
    timeZone: TZ,
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return { time, day, date };
}

export function NonGameClock() {
  const { time, day, date } = useClock();

  return (
    <div className="absolute top-5 right-6 z-20">
      <div className="relative min-w-[290px] overflow-hidden bg-black/90 px-5 py-4">

        {/* TIME */}
        <div className="text-[52px] font-black leading-none tracking-[-0.06em] text-white tabular-nums font-mono">
          {time}
        </div>

        {/* DAY + DATE */}
        <div className="mt-2 flex items-baseline gap-3 whitespace-nowrap">
          <span className="text-[16px] font-black tracking-[0.18em] uppercase text-white">
            {day}
          </span>

          <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#9a9a9a]">
            {date}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Clock() {
  const { time, day, date } = useClock();

  return (
    <div className="absolute top-5 right-6 z-20">
      <div className="relative min-w-[290px] overflow-hidden border border-white/15 border-l-[5px] border-l-white bg-black/90 px-5 py-4 shadow-[0_6px_24px_rgba(0,0,0,0.7)]">

        {/* TIME */}
        <div className="text-[52px] font-black leading-none tracking-[-0.06em] text-white tabular-nums font-mono">
          {time}
        </div>

        {/* DAY + DATE */}
        <div className="mt-2 flex items-baseline gap-3 whitespace-nowrap">
          <span className="text-[16px] font-black tracking-[0.18em] uppercase text-white">
            {day}
          </span>

          <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#9a9a9a]">
            {date}
          </span>
        </div>

        {/* BROADCAST ACCENT */}
        <div className="absolute bottom-0 left-0 h-[3px] w-full bg-gradient-to-r from-white via-white/50 to-transparent" />
      </div>
    </div>
  );
}
