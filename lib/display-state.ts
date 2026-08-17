import { db } from "./db";
import { getDisplayDate } from "./settings";
import { isoToLocalDate, formatTimeLocal, formatDateLabel, addMinutes, addDaysLocal } from "./tz";

export interface CrewRow {
  short_label: string;
  display_order: number;
  names: string[];
}

export interface ScheduleRow {
  label: string;
  time: string | null;
}

export interface UpcomingGame {
  sport: string;
  game_date: string;
  opponent: string | null;
  opponent_abbr: string | null;
  logo_url: string | null;
  kickoff: string | null;
  home_away?: string | null;
  crew_call?: string | null;
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
  schedule?: ScheduleRow[];
  upcoming?: UpcomingGame[];
}

function formatName(full: string): string {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].toUpperCase();
  const first = parts[0];
  const lastInitial = parts[parts.length - 1];
  return `${first} ${lastInitial}`.toUpperCase();
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

    if (!disp) {
    const upcoming = (await db().execute(`
      SELECT
        gi.sport,
        gi.game_date,
        gi.opponent,
        gi.opponent_abbr,
        gi.logo_url,
        gi.kickoff,
        (
          SELECT MIN(s.dtstart) FROM shifts s
          WHERE s.sport = gi.sport
            AND substr(s.dtstart, 1, 10) = gi.game_date
        ) AS crew_call
      FROM game_info gi
      WHERE gi.game_date >= date('now')
        AND gi.game_date <= date('now', '+30 days')
      ORDER BY gi.game_date, gi.sport
    `)).rows.map(r => ({
      sport: r.sport as string,
      game_date: r.game_date as string,
      opponent: (r.opponent as string) ?? null,
      opponent_abbr: (r.opponent_abbr as string) ?? null,
      logo_url: (r.logo_url as string) ?? null,
      kickoff: (r.kickoff as string) ?? null,
      crew_call: (r.crew_call as string) ?? null,
    }));
      return { panel, hasContent: false, upcoming };
    }
  const sport = disp.sport as string;
  const display_type = disp.display_type as string;
  const game_date = disp.game_date as string;
  const department = display_type === "bigscreen" ? "Big Screen" : "Broadcast";

  const dateRange = [
    game_date,
    addDaysLocal(game_date, -1),
    addDaysLocal(game_date, 1),
  ];

  // Shifts (crew)
  const shifts = (await db().execute({
    sql: `SELECT employee_name, position FROM shifts
          WHERE sport = ? AND department = ?
            AND substr(dtstart, 1, 10) IN (?, ?, ?)
          ORDER BY dtstart`,
    args: [sport, department, ...dateRange],
  })).rows;

  // Position map
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

  // Game info — pick the correct game for a doubleheader
  const games = (await db().execute({
    sql: `SELECT opponent, opponent_abbr, logo_url, kickoff
          FROM game_info
          WHERE sport = ? AND game_date = ?
          ORDER BY kickoff ASC`,
    args: [sport, game_date],
  })).rows;

  // Rule: show latest game whose kickoff - 30min <= now; else earliest
  const now = Date.now();
  const SWITCH_BUFFER_MS = 30 * 60 * 1000;
  let info = games[0];
  for (const g of games) {
    const k = g.kickoff as string | null;
    if (!k) continue;
    if (new Date(k).getTime() - SWITCH_BUFFER_MS <= now) {
      info = g;
    }
  }

  // Schedule block: crew_call = earliest ICS shift start
  const crewCallRow = (await db().execute({
    sql: `SELECT MIN(dtstart) AS crew_call FROM shifts
          WHERE sport = ? AND department = ?
            AND substr(dtstart, 1, 10) IN (?, ?, ?)`,
    args: [sport, department, ...dateRange],
  })).rows[0];

  const crewCall = (crewCallRow?.crew_call as string) || null;
  const gameTime = (info?.kickoff as string) || null;

  const templateRows = (await db().execute({
    sql: `SELECT label, ref, offset_minutes FROM schedule_template
          WHERE sport = ? AND display_type = ?`,
    args: [sport, display_type],
  })).rows;

  type WithTs = ScheduleRow & { _ts: number };
  const withTs: WithTs[] = templateRows.map(r => {
    const ref = r.ref as string;
    const off = Number(r.offset_minutes);
    const anchor = ref === "crew_call" ? crewCall : gameTime;
    return {
      label: r.label as string,
      time: anchor ? formatTimeLocal(addMinutes(anchor, off)) : null,
      _ts: anchor ? new Date(addMinutes(anchor, off)).getTime() : Number.MAX_SAFE_INTEGER,
    };
  });
  withTs.sort((a, b) => a._ts - b._ts);
  const schedule: ScheduleRow[] = withTs.map(({ label, time }) => ({ label, time }));
  console.log("[DEBUG] crew rows:", crew.map(c => ({ label: c.short_label, count: c.names.length, names: c.names })));
  
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
    schedule,
  };
}