import { db } from "./db";
import { getDisplayDate } from "./settings";
import {
  isoToLocalDate,
  formatTimeLocal,
  formatDateLabel,
  addMinutes,
  addDaysLocal,
} from "./tz";

export interface CrewRow {
  short_label: string;
  display_order: number;
  names: string[];
}

export interface ScheduleRow {
  label: string;
  time: string | null;
  startTime?: string;
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
  kickoff?: string | null;
  opponent?: string | null;
  logoUrl?: string | null;
  title?: string;
  dateLabel?: string;
  crew?: CrewRow[];
  schedule?: ScheduleRow[];
  activeScheduleIndex?: number;
  upcoming?: UpcomingGame[];
  engineeringCrew?: CrewRow[];
}

function formatName(full: string): string {
  const parts = full.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].toUpperCase();
  }

  const first = parts[0];
  const lastInitial = parts[parts.length - 1];

  return `${first} ${lastInitial}`.toUpperCase();
}

function titleFor(sport: string, displayType: string): string {
  const t = displayType === "bigscreen" ? "VIDEOBOARD" : "BROADCAST";
  return `${sport.toUpperCase()} ${t}`;
}

export async function getPanelState(
  panel: number,
  date?: string
): Promise<DisplayState> {
  const gd = date || (await getDisplayDate());

  /*
   * Find the display assigned to this control room panel.
   */
  const dispResult = await db().execute({
    sql: `
      SELECT
        d.id,
        d.sport,
        d.display_type,
        d.game_date
      FROM assignments a
      JOIN displays d ON d.id = a.display_id
      WHERE a.control_room_id = ?
        AND a.game_date = ?
      LIMIT 1
    `,
    args: [panel, gd],
  });

  const disp = dispResult.rows[0];

  /*
   * If this panel doesn't currently have a game assigned,
   * return the upcoming games instead.
   */
  if (!disp) {
    const upcomingResult = await db().execute(`
      SELECT
        gi.sport,
        gi.game_date,
        gi.opponent,
        gi.opponent_abbr,
        gi.logo_url,
        gi.kickoff,
        (
          SELECT MIN(s.dtstart)
          FROM shifts s
          WHERE s.sport = gi.sport
            AND substr(s.dtstart, 1, 10) = gi.game_date
        ) AS crew_call
      FROM game_info gi
      WHERE gi.game_date >= date('now')
        AND gi.game_date <= date('now', '+30 days')
      ORDER BY gi.game_date, gi.sport
    `);

    const upcoming: UpcomingGame[] = upcomingResult.rows.map((r) => ({
      sport: r.sport as string,
      game_date: r.game_date as string,
      opponent: (r.opponent as string) ?? null,
      opponent_abbr: (r.opponent_abbr as string) ?? null,
      logo_url: (r.logo_url as string) ?? null,
      kickoff: (r.kickoff as string) ?? null,
      crew_call: (r.crew_call as string) ?? null,
    }));

    return {
      panel,
      hasContent: false,
      upcoming,
    };
  }

  const sport = disp.sport as string;
  const display_type = disp.display_type as string;
  const game_date = disp.game_date as string;

  const department =
    display_type === "bigscreen" ? "Big Screen" : "Broadcast";

  /*
   * Date range allows shifts around midnight to be considered
   * before we convert them to local dates.
   */
  const dateRange = [
    game_date,
    addDaysLocal(game_date, -1),
    addDaysLocal(game_date, 1),
  ];

  /*
   * ------------------------------------------------------------
   * GAME INFO
   * ------------------------------------------------------------
   */
  const gamesResult = await db().execute({
    sql: `
      SELECT
        opponent,
        opponent_abbr,
        logo_url,
        kickoff
      FROM game_info
      WHERE sport = ?
        AND game_date = ?
      ORDER BY kickoff ASC
    `,
    args: [sport, game_date],
  });
  const games = gamesResult.rows;

  /*
   * For a doubleheader:
   * - Before the first game is within 30 minutes, show the first game.
   * - Once a game's kickoff is within 30 minutes of now, switch to it.
   */
  const now = Date.now();
  const SWITCH_BUFFER_MS = 45 * 60 * 1000;
  let info = games[0];
  for (const g of games) {
    const k = g.kickoff as string | null;
    if (!k) {
      continue;
    }
    if (new Date(k).getTime() - SWITCH_BUFFER_MS <= now) {
      info = g;
    }
  }

  /*
   * Selected game's kickoff.
   */
  const selectedKickoff = (info?.kickoff as string) || null;

  /*
   * ------------------------------------------------------------
   * SHIFTS / CREW
   * ------------------------------------------------------------
   */
const shiftsRawResult = await db().execute({
  sql: `
    SELECT
      employee_name,
      position,
      dtstart
    FROM shifts
    WHERE sport = ?
      AND department = ?
      AND substr(dtstart, 1, 10) IN (?, ?, ?)
    ORDER BY dtstart
  `,
  args: [sport, department, ...dateRange],
});

const shiftsRaw = shiftsRawResult.rows;

/*
 * Only use shifts from the selected game's local date.
 */
const sameDayShifts = shiftsRaw.filter((s) => {
  return isoToLocalDate(s.dtstart as string) === game_date;
});

/*
 * If there is no selected kickoff, use all shifts from that day.
 */
let shifts = sameDayShifts;

if (selectedKickoff && sameDayShifts.length > 0) {
  const kickoffTime = new Date(selectedKickoff).getTime();

  let closestShiftTime: number | null = null;
  let closestDiff = Number.MAX_SAFE_INTEGER;

  for (const s of sameDayShifts) {
    const shiftTime = new Date(s.dtstart as string).getTime();
    const diff = Math.abs(shiftTime - kickoffTime);

    if (diff < closestDiff) {
      closestDiff = diff;
      closestShiftTime = shiftTime;
    }
  }

  /*
   * Once the closest shift time is found, include shifts that
   * belong to that same crew-call group.
   *
   * A 30-minute grouping window handles multiple employees
   * having slightly different call times.
   */
  const CREW_CALL_GROUP_WINDOW_MS = 30 * 60 * 1000;

  if (closestShiftTime !== null) {
    shifts = sameDayShifts.filter((s) => {
      const shiftTime = new Date(s.dtstart as string).getTime();
      return (
        Math.abs(shiftTime - closestShiftTime) <=
        CREW_CALL_GROUP_WINDOW_MS
      );
    });
  }
}
  /*
   * ------------------------------------------------------------
   * POSITION MAP
   * ------------------------------------------------------------
   */
  const posMapResult = await db().execute({
    sql: `
      SELECT
        ics_position,
        short_label,
        display_order
      FROM position_map
      WHERE display_type = ?
        AND sport = ?
    `,
    args: [display_type, sport],
  });

  const posMap = posMapResult.rows;

  const mapByPos = new Map<
    string,
    {short_label: string; display_order: number;}
  >();

  for (const p of posMap) {
    mapByPos.set(p.ics_position as string, {
      short_label: p.short_label as string,
      display_order: Number(p.display_order),
    });
  }

  /*
   * Group employees by their ICS position.
   */
  const byPosition = new Map<string, string[]>();
  for (const s of shifts) {
    const pos = s.position as string;
    if (!byPosition.has(pos)) {
      byPosition.set(pos, []);
    }
    byPosition.get(pos)!.push(
      formatName(s.employee_name as string)
    );
  }
  /*
   * Build crew rows using the configured position map.
   */
  const crew: CrewRow[] = [];
  const seen = new Set<string>();

  for (const [icsPos, meta] of mapByPos.entries()) {
    crew.push({
      short_label: meta.short_label,
      display_order: meta.display_order,
      names: byPosition.get(icsPos) || [],
    });

    seen.add(icsPos);
  }

  /*
   * Add any positions that aren't configured in position_map.
   */
  for (const [pos, names] of byPosition.entries()) {
    if (!seen.has(pos)) {
      crew.push({
        short_label: pos.toUpperCase(),
        display_order: 9999,
        names,
      });
    }
  }

  crew.sort((a, b) => a.display_order - b.display_order);

  /*
  * ------------------------------------------------------------
  * ENGINEERING CREW (panel 2 only)
  * ------------------------------------------------------------
  */
  let engineeringCrew: CrewRow[] | undefined;

  if (panel === 2) {
    const engShiftsResult = await db().execute({
      sql: `
        SELECT employee_name, position, dtstart
        FROM shifts
        WHERE sport = ?
          AND department = 'Engineering'
          AND substr(dtstart, 1, 10) IN (?, ?, ?)
        ORDER BY dtstart
      `,
      args: [sport, ...dateRange],
    });

    const engSameDay = engShiftsResult.rows.filter(
      (s) => isoToLocalDate(s.dtstart as string) === game_date
    );

    let engShifts = engSameDay;

    if (selectedKickoff && engSameDay.length > 0) {
      const kickoffTime = new Date(selectedKickoff).getTime();
      let closestShiftTime: number | null = null;
      let closestDiff = Number.MAX_SAFE_INTEGER;

      for (const s of engSameDay) {
        const shiftTime = new Date(s.dtstart as string).getTime();
        const diff = Math.abs(shiftTime - kickoffTime);
        if (diff < closestDiff) {
          closestDiff = diff;
          closestShiftTime = shiftTime;
        }
      }

      const GROUP_WINDOW_MS = 30 * 60 * 1000;
      if (closestShiftTime !== null) {
        engShifts = engSameDay.filter((s) => {
          const t = new Date(s.dtstart as string).getTime();
          return Math.abs(t - closestShiftTime) <= GROUP_WINDOW_MS;
        });
      }
    }

    const engByPosition = new Map<string, string[]>();
    for (const s of engShifts) {
      const pos = s.position as string;
      if (!engByPosition.has(pos)) engByPosition.set(pos, []);
      engByPosition.get(pos)!.push(formatName(s.employee_name as string));
    }

    engineeringCrew = Array.from(engByPosition.entries()).map(
      ([pos, names], i) => ({
        short_label: pos.toUpperCase(),
        display_order: i,
        names,
      })
    );
  }


  /*
   * ------------------------------------------------------------
   * CREW CALL
   * ------------------------------------------------------------
   */
  const crewCall =
    shifts.length > 0
      ? shifts.reduce((min, s) => {
          const d = s.dtstart as string;

          return !min || d < min ? d : min;
        }, "" as string) || null
      : null;
  const gameTime = (info?.kickoff as string) || null;

  /*
   * ------------------------------------------------------------
   * SCHEDULE
   * ------------------------------------------------------------
   */
  const templateRowsResult = await db().execute({
    sql: `
      SELECT
        label,
        ref,
        offset_minutes
      FROM schedule_template
      WHERE sport = ?
        AND display_type = ?
    `,
    args: [sport, display_type],
  });
  const templateRows = templateRowsResult.rows;
  type WithTs = ScheduleRow & {
    _ts: number;
  };

  const withTs: WithTs[] = templateRows.map((r) => {
    const ref = r.ref as string;
    const off = Number(r.offset_minutes);
    const anchor = ref === "crew_call" ? crewCall : gameTime;
    const iso = anchor ? addMinutes(anchor, off) : null;
    return {
      label: r.label as string,
      time: iso ? formatTimeLocal(iso) : null,
      startTime: iso ?? undefined,
      _ts: iso ? new Date(iso).getTime() : Number.MAX_SAFE_INTEGER,
    };
  });

  withTs.sort((a, b) => a._ts - b._ts);

  const schedule: ScheduleRow[] = withTs.map(({ label, time, startTime }) => ({
    label,
    time,
    startTime,
  }));
  /*
   * ------------------------------------------------------------
   * FINAL DISPLAY STATE
   * ------------------------------------------------------------
   */
  return {
    panel,
    hasContent: true,
    sport,
    displayType: display_type,
    gameDate: game_date,
    kickoff: gameTime,
    opponent: (info?.opponent as string) ?? null,
    logoUrl: (info?.logo_url as string) ?? null,
    title: titleFor(sport, display_type),
    dateLabel: formatDateLabel(game_date),
    crew,
    schedule,
    engineeringCrew,
  };
}