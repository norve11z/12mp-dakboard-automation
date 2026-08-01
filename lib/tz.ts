export const TZ = "America/Chicago";

/** YYYY-MM-DD in Chicago local time for an ISO instant */
export function isoToLocalDate(iso: string): string {
  const d = new Date(iso);
  const y = d.toLocaleString("en-CA", { timeZone: TZ, year: "numeric" });
  const m = d.toLocaleString("en-CA", { timeZone: TZ, month: "2-digit" });
  const day = d.toLocaleString("en-CA", { timeZone: TZ, day: "2-digit" });
  return `${y}-${m}-${day}`;
}

/** Today's YYYY-MM-DD in Chicago */
export function todayLocal(): string {
  return isoToLocalDate(new Date().toISOString());
}

/** Format ISO instant → e.g. "6:00 AM" in Chicago */
export function formatTimeLocal(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    timeZone: TZ,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** Format YYYY-MM-DD → "December 20, 2025" (no timezone shift) */
export function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
}

/** Chicago offset in hours for a given UTC instant (handles DST) */
export function chicagoOffsetHours(instant: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ, timeZoneName: "shortOffset",
  }).formatToParts(instant);
  const off = parts.find(p => p.type === "timeZoneName")?.value || "GMT-6";
  const m = off.match(/GMT([+-]\d+)/);
  return m ? parseInt(m[1], 10) : -6;
}

/** Build an ISO instant from a Chicago wall-clock date + HH:MM */
export function chicagoWallToIso(date: string, hm: string): string {
  const [h, mn] = hm.split(":").map(Number);
  const [y, mo, d] = date.split("-").map(Number);
  const probe = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0));
  const offset = chicagoOffsetHours(probe);
  return new Date(Date.UTC(y, mo - 1, d, h - offset, mn, 0)).toISOString();
}

/** Add signed minutes to an ISO instant */
export function addMinutes(iso: string, mins: number): string {
  return new Date(new Date(iso).getTime() + mins * 60000).toISOString();
}

/** Add signed days to a YYYY-MM-DD (Chicago), returns YYYY-MM-DD */
export function addDaysLocal(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days, 12, 0, 0));
  return isoToLocalDate(dt.toISOString());
}