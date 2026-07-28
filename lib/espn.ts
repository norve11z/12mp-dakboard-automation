import { db } from "./db";

const TEAMS: Record<string, { league: string; teamId: number }> = {
  "Football":            { league: "football/college-football",             teamId: 245 },
  "Men's Basketball":    { league: "basketball/mens-college-basketball",    teamId: 245 },
  "Women's Basketball":  { league: "basketball/womens-college-basketball",  teamId: 245 },
  "Baseball":            { league: "baseball/college-baseball",             teamId: 245 },
  "Softball":            { league: "softball/college-softball",             teamId: 245 },
  "Volleyball":          { league: "volleyball/womens-college-volleyball",  teamId: 245 },
  "Soccer":              { league: "soccer/usa.ncaa.w.1",                   teamId: 245 },
};

interface EspnCompetitor {
  id: string; homeAway: string;
  team: { id: string; displayName: string; shortDisplayName: string; logos?: { href: string }[]; logo?: string };
}
interface EspnEvent {
  id: string; date: string;
  competitions: { competitors: EspnCompetitor[] }[];
}
interface EspnResponse { events?: EspnEvent[] }

async function fetchJson(url: string): Promise<EspnResponse> {
  const res = await fetch(url, { headers: { "User-Agent": "controlroom-app" } });
  if (!res.ok) throw new Error(`ESPN ${res.status}`);
  return await res.json() as EspnResponse;
}

async function fetchTeamSchedule(sport: string): Promise<EspnEvent[]> {
  const team = TEAMS[sport]; if (!team) return [];
  const url = `https://site.api.espn.com/apis/site/v2/sports/${team.league}/teams/${team.teamId}/schedule`;
  try { return (await fetchJson(url)).events || []; } catch { return []; }
}

async function fetchScoreboardForDate(sport: string, yyyymmdd: string): Promise<EspnEvent[]> {
  const team = TEAMS[sport]; if (!team) return [];
  const url = `https://site.api.espn.com/apis/site/v2/sports/${team.league}/scoreboard?limit=300&dates=${yyyymmdd}`;
  try {
    const data = await fetchJson(url);
    return (data.events || []).filter(ev =>
      ev.competitions?.[0]?.competitors?.some(c => c.team.id === String(team.teamId))
    );
  } catch { return []; }
}

function localDate(iso: string): string {
  const d = new Date(iso);
  const y = d.toLocaleString("en-CA", { timeZone: "America/Chicago", year: "numeric" });
  const m = d.toLocaleString("en-CA", { timeZone: "America/Chicago", month: "2-digit" });
  const day = d.toLocaleString("en-CA", { timeZone: "America/Chicago", day: "2-digit" });
  return `${y}-${m}-${day}`;
}

function parseGame(ev: EspnEvent, teamId: number) {
  const comp = ev.competitions[0]; if (!comp) return null;
  const us = comp.competitors.find(c => c.team.id === String(teamId));
  const them = comp.competitors.find(c => c.team.id !== String(teamId));
  if (!us || !them) return null;
  return {
    opponent: them.team.displayName,
    logo_url: them.team.logos?.[0]?.href || them.team.logo || null,
    kickoff: ev.date,
    home_away: us.homeAway,
  };
}

export async function refreshSchedules() {
  const pairs = (await db().execute(`
    SELECT DISTINCT sport, substr(dtstart, 1, 10) AS iso_date
    FROM shifts
    WHERE department IN ('Broadcast', 'Big Screen')
  `)).rows;

  const targets = new Map<string, Set<string>>();
  for (const p of pairs) {
    const sport = p.sport as string;
    if (!TEAMS[sport]) continue;
    const local = localDate((p.iso_date as string) + "T12:00:00Z");
    if (!targets.has(sport)) targets.set(sport, new Set());
    targets.get(sport)!.add(local);
  }

  const errors: string[] = [];
  let updated = 0, skipped = 0, missing = 0;

  for (const [sport, dates] of targets.entries()) {
    const teamId = TEAMS[sport].teamId;
    const scheduleEvents = await fetchTeamSchedule(sport);
    const byDate = new Map<string, EspnEvent>();
    for (const ev of scheduleEvents) byDate.set(localDate(ev.date), ev);

    for (const gd of dates) {
      let match = byDate.get(gd);
      if (!match) {
        const yyyymmdd = gd.replaceAll("-", "");
        const fallback = await fetchScoreboardForDate(sport, yyyymmdd);
        match = fallback.find(ev => localDate(ev.date) === gd);
      }
      if (!match) { missing++; continue; }
      const parsed = parseGame(match, teamId);
      if (!parsed) { missing++; continue; }

      const existing = (await db().execute({
        sql: `SELECT source FROM game_info WHERE sport = ? AND game_date = ?`,
        args: [sport, gd],
      })).rows[0];
      if ((existing?.source as string) === "manual") { skipped++; continue; }

      await db().execute({
        sql: `INSERT INTO game_info (sport, game_date, opponent, kickoff, notes, logo_url, source)
              VALUES (?, ?, ?, ?, NULL, ?, 'espn')
              ON CONFLICT(sport, game_date) DO UPDATE SET
                opponent = CASE WHEN game_info.source = 'manual' THEN game_info.opponent ELSE excluded.opponent END,
                kickoff  = CASE WHEN game_info.source = 'manual' THEN game_info.kickoff  ELSE excluded.kickoff  END,
                logo_url = CASE WHEN game_info.source = 'manual' THEN game_info.logo_url ELSE excluded.logo_url END,
                source   = CASE WHEN game_info.source = 'manual' THEN 'manual' ELSE 'espn' END`,
        args: [sport, gd, parsed.opponent, parsed.kickoff, parsed.logo_url],
      });
      updated++;
    }
  }

  return { updated, skipped, missing, errors };
}