import { db } from "./db";
import { getDisplayDate } from "./settings";

export interface CrewRow {
  short_label: string;
  display_order: number;
  names: string[];
}

export interface DisplayState {
  panel: number;
  hasContent: boolean;
  sport?: string;
  displayType?: string;
  gameDate?: string;
  opponent?: string | null;
  logoUrl?: string | null;
  title?: string;
  dateLabel?: string;
  crew?: CrewRow[];
}

function formatName(full: string): string {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].toUpperCase();
  const first = parts[0];
  const lastInitial = parts[parts.length - 1][0];
  return `${first} ${lastInitial}.`.toUpperCase();
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

export async function getPanelState(panel: number, date?: string): Promise<DisplayState> {
  const gd = date || (await getDisplayDate());

  const disp = (await db().execute({
    sql: `SELECT d.id, d.sport, d.display_type, d.game_date
          FROM assignments a JOIN displays d ON d.id = a.display_id
          WHERE a.control_room_id = ? AND a.game_date = ? LIMIT 1`,
    args: [panel, gd],
  })).rows[0];

  if (!disp) return { panel, hasContent: false };
  const sport = disp.sport as string;
  const display_type = disp.display_type as string;
  const game_date = disp.game_date as string;

  const shifts = (await db().execute({
    sql: `SELECT employee_name, position FROM shifts
          WHERE sport = ? AND department = ?
            AND substr(dtstart, 1, 10) IN (?, ?, ?)
          ORDER BY dtstart`,
    args: [
      sport,
      display_type === "bigscreen" ? "Big Screen" : "Broadcast",
      game_date,
      new Date(new Date(game_date).getTime() - 86400000).toISOString().slice(0, 10),
      new Date(new Date(game_date).getTime() + 86400000).toISOString().slice(0, 10),
    ],
  })).rows;

  const posMap = (await db().execute({
    sql: `SELECT ics_position, short_label, display_order FROM position_map
          WHERE display_type = ? AND sport = ?`,
    args: [display_type, sport],
  })).rows;

  const mapByPos = new Map<string, { short_label: string; display_order: number }>();
  for (const p of posMap) {
    mapByPos.set(p.ics_position as string, {
      short_label: p.short_label as string,
      display_order: Number(p.display_order),
    });
  }

  const byPosition = new Map<string, string[]>();
  for (const s of shifts) {
    const pos = s.position as string;
    if (!byPosition.has(pos)) byPosition.set(pos, []);
    byPosition.get(pos)!.push(formatName(s.employee_name as string));
  }

  const crew: CrewRow[] = [];
  const seen = new Set<string>();
  for (const [icsPos, meta] of mapByPos.entries()) {
    crew.push({ short_label: meta.short_label, display_order: meta.display_order, names: byPosition.get(icsPos) || [] });
    seen.add(icsPos);
  }
  for (const [pos, names] of byPosition.entries()) {
    if (!seen.has(pos)) {
      crew.push({ short_label: pos.toUpperCase(), display_order: 9999, names });
    }
  }
  crew.sort((a, b) => a.display_order - b.display_order);

  const info = (await db().execute({
    sql: `SELECT opponent, logo_url FROM game_info WHERE sport = ? AND game_date = ?`,
    args: [sport, game_date],
  })).rows[0];

  return {
    panel,
    hasContent: true,
    sport,
    displayType: display_type,
    gameDate: game_date,
    opponent: (info?.opponent as string) ?? null,
    logoUrl: (info?.logo_url as string) ?? null,
    title: titleFor(sport, display_type),
    dateLabel: formatDateLabel(game_date),
    crew,
  };
}