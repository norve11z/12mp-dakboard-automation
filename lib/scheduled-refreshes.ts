import { db } from "./db";

/**
 * Scans today+future game_info for sports with 2+ games on the same date,
 * and schedules a refresh 45 minutes before each game after the first.
 */
export async function rebuildScheduledRefreshes() {
  // Get all future games grouped by (sport, date)
  const result = await db().execute(`
    SELECT sport, game_date, kickoff
    FROM game_info
    WHERE game_date >= date('now')
      AND kickoff IS NOT NULL
    ORDER BY sport, game_date, kickoff
  `);

  // Group by sport+date
  const groups = new Map<string, string[]>();
  for (const row of result.rows) {
    const key = `${row.sport}|${row.game_date}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row.kickoff as string);
  }

  // For each group with 2+ games, schedule switches 45min before games 2..N
  const inserts: { sport: string; game_date: string; switch_at: string }[] = [];
  for (const [key, kickoffs] of groups.entries()) {
    if (kickoffs.length < 2) continue;
    const [sport, game_date] = key.split("|");
    for (let i = 1; i < kickoffs.length; i++) {
      const switchAt = new Date(
        new Date(kickoffs[i]).getTime() - 4.5 * 60 * 60 * 1000
      ).toISOString();
      inserts.push({ sport, game_date, switch_at: switchAt });
    }
  }

  // Clear future entries and reinsert (idempotent)
  await db().execute(`
    DELETE FROM scheduled_refreshes
    WHERE switch_at >= datetime('now')
  `);

  for (const row of inserts) {
    await db().execute({
      sql: `
        INSERT OR IGNORE INTO scheduled_refreshes (sport, game_date, switch_at)
        VALUES (?, ?, ?)
      `,
      args: [row.sport, row.game_date, row.switch_at],
    });
  }

  return { scheduled: inserts.length };
}