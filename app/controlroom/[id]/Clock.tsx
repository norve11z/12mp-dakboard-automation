"use client";

import { useEffect, useState } from "react";
import { TZ } from "@/lib/tz";

function useClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!now) return { time: "", day: "", date: "" };

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
      <div className="relative min-w-[300px] overflow-hidden bg-black/90 px-5 py-4">

        {/* TIME */}
        <div className="text-[60px] font-black leading-none tracking-[-0.06em] text-white tabular-nums font-mono">
          {time}
        </div>

        {/* DAY + DATE */}
        <div className="mt-2 flex items-baseline gap-3 whitespace-nowrap">
          <span className="text-[20px] font-black tracking-[0.18em] uppercase text-white">
            {day}
          </span>

          <span className="text-[20px] font-bold tracking-[0.18em] uppercase text-[#9a9a9a]">
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
    <div className="absolute top-3 right-6 z-20">
        <div className="relative min-w-[290px] overflow-hidden bg-black/90 px-5 py-3">

        {/* TIME */}
        <div className="text-center text-[40px] font-black leading-none tracking-[-0.06em] text-white tabular-nums font-mono">
            {time}
        </div>

        {/* DAY + DATE */}
        <div className="mt-2 flex items-center justify-center gap-3 whitespace-nowrap">
            <span className="text-[16px] font-black tracking-[0.18em] uppercase text-white">
            {day}
            </span>

            <span className="text-[12px] font-bold tracking-[0.18em] uppercase text-[#9a9a9a]">
            {date}
            </span>
        </div>

        </div>
    </div>
  );
}

export function GameCountdown({ kickoff }: { kickoff: string | null | undefined }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!kickoff) {
    return null;
  }

  const difference = new Date(kickoff).getTime() - now.getTime();

  if (difference <= 0) {
    return null;
  }

  const totalMinutes = Math.floor(difference / 1000 / 60);

  let countdown = "";

  if (totalMinutes > 90) {
    const days = Math.ceil(totalMinutes / (60 * 24));
    countdown = `${days} DAY${days === 1 ? "" : "S"}`;
  } else {
    const totalSeconds = Math.floor(difference / 1000);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    countdown = [
      hours.toString().padStart(2, "0"),
      minutes.toString().padStart(2, "0"),
      seconds.toString().padStart(2, "0"),
    ].join(":");
  }

  return (
    <span className="inline-flex items-baseline gap-2 whitespace-nowrap">
      <span className="font-black tabular-nums text-[#ffd21a]">
        {countdown}
      </span>

      <span className="text-[11px] font-bold tracking-[0.16em] uppercase text-[#9a9a9a]">
        UNTIL GAME TIME
      </span>
    </span>
  );
}