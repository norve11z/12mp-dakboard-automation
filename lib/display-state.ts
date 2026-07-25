import db from "./db";
import { initDb } from "./init-db";

export interface CrewRow {
  short_label: string;
  display_order: number;
  names: string[];  // first-name last-initial per person; empty = TBD
}

export interface DisplayState {
  panel: number;
  hasContent: boolean;
  sport?: string;
  displayType?: string;
  gameDate?: string;
  opponent?: string | null;
  title?: string;         // e.g. "FOOTBALL VIDEOBOARD"
  dateLabel?: string;     // "December 20, 2025"
  crew?: CrewRow[];
}

function formatName(full: string): string {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].toUpperCase();
  const first = parts[0];
  const lastInitial = parts[parts.length - 1][0];
  return `${first} ${lastInitial}.`.toUpperCase();
}

function today(): string {
  const d = new Date();
  const y = d.toLocaleString("en-CA", { timeZone: "America/Chicago", year: "numeric" });
  const m = d.toLocaleString("en-CA", { timeZone: "America/Chicago", month: "2-digit" });
  const day = d.toLocaleString("en-CA", { timeZone: "America/Chicago", day: "2-digit" });
  return `${y}-${m}-${day}`;
}

function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function titleFor(sport: string, displayType: string): string {
  const t = displayType === "bigscreen" ? "VIDEOBOARD" : "BROADCAST";
  return `${sport.toUpperCase()} ${t}`;
}

import { getDisplayDate } from "./settings";
// ...
export function getPanelState(panel: number, date?: string): DisplayState {
  initDb();
  const gd = date || getDisplayDate();

  
  const row = db.prepare(`
    SELECT d.id, d.sport, d.display_type, d.game_date
    FROM assignments a
    JOIN displays d ON d.id = a.display_id
    WHERE a.control_room_id = ? AND a.game_date = ?
    LIMIT 1
  `).get(panel, gd) as { id: number; sport: string; display_type: string; game_date: string } | undefined;

  if (!row) return { panel, hasContent: false };

  // Fetch shifts for this display
  const shifts = db.prepare(`
    SELECT employee_name, position FROM shifts
    WHERE sport = ? AND department = ?
      AND substr(dtstart,1,10) IN (?, ?, ?)
    ORDER BY dtstart
  `).all(
    row.sport,
    row.display_type === "bigscreen" ? "Big Screen" : "Broadcast",
    row.game_date,
    // Handle timezone edge: shifts within ±1 day
    new Date(new Date(row.game_date).getTime() - 86400000).toISOString().slice(0,10),
    new Date(new Date(row.game_date).getTime() + 86400000).toISOString().slice(0,10)
  ) as { employee_name: string; position: string }[];

  // Position map: prefer sport-specific, fall back to '*'
  const posMap = db.prepare(`
    SELECT ics_position, short_label, display_order, sport
    FROM position_map
    WHERE display_type = ? AND (sport = ? OR sport = '*')
  `).all(row.display_type, row.sport) as { ics_position: string; short_label: string; display_order: number; sport: string }[];

  // Prefer sport-specific over '*'
  const mapByPos = new Map<string, { short_label: string; display_order: number }>();
  for (const p of posMap) {
    const existing = mapByPos.get(p.ics_position);
    if (!existing || p.sport !== "*") {
      mapByPos.set(p.ics_position, { short_label: p.short_label, display_order: p.display_order });
    }
  }

  // Group employees by position
  const byPosition = new Map<string, string[]>();
  for (const s of shifts) {
    if (!byPosition.has(s.position)) byPosition.set(s.position, []);
    byPosition.get(s.position)!.push(formatName(s.employee_name));
  }

  // Build crew rows from position map (ensures order + TBD)
  const crew: CrewRow[] = [];
  const seen = new Set<string>();
  for (const [icsPos, meta] of mapByPos.entries()) {
    const names = byPosition.get(icsPos) || [];
    crew.push({ short_label: meta.short_label, display_order: meta.display_order, names });
    seen.add(icsPos);
  }
  // Any ICS positions not in the map — append at end with raw label
  for (const [pos, names] of byPosition.entries()) {
    if (!seen.has(pos)) {
      crew.push({ short_label: pos.toUpperCase(), display_order: 9999, names });
    }
  }
  crew.sort((a, b) => a.display_order - b.display_order);

  const info = db.prepare(`SELECT opponent FROM game_info WHERE sport = ? AND game_date = ?`)
    .get(row.sport, row.game_date) as { opponent: string | null } | undefined;

  return {
    panel,
    hasContent: true,
    sport: row.sport,
    displayType: row.display_type,
    gameDate: row.game_date,
    opponent: info?.opponent ?? null,
    title: titleFor(row.sport, row.display_type),
    dateLabel: formatDateLabel(row.game_date),
    crew,
  };
}