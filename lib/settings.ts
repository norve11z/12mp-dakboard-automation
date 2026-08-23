import { db } from "./db";
import { todayLocal } from "./tz";

export async function getSetting(key: string): Promise<string | null> {
  const r = await db().execute({ sql: `SELECT value FROM app_settings WHERE key = ?`, args: [key] });
  return (r.rows[0]?.value as string) ?? null;
}

export async function setSetting(key: string, value: string | null): Promise<void> {
  await db().execute({
    sql: `INSERT INTO app_settings (key, value) VALUES (?, ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    args: [key, value],
  });
}

export async function getDisplayDate(): Promise<string> {
  // Manual override wins
  const overrideRes = await db().execute({
    sql: `SELECT value FROM app_settings WHERE key = 'display_date_override'`,
    args: [],
  });
  const override = overrideRes.rows[0]?.value as string | undefined;
  if (override && override.trim() !== "") return override;

  // Today in Chicago
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Chicago",
  });

  // Lookahead logic
  const days = await getLookaheadDays();
  if (days <= 0) return today;

  // Find the nearest game within [today, today+N days]
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + days);
  const endIso = endDate.toISOString().slice(0, 10);

  const gameRes = await db().execute({
    sql: `
      SELECT game_date FROM game_info
      WHERE game_date >= ? AND game_date <= ?
      ORDER BY game_date ASC
      LIMIT 1
    `,
    args: [today, endIso],
  });

  const nearest = gameRes.rows[0]?.game_date as string | undefined;
  return nearest ?? today;
}

export async function getLookaheadDays(): Promise<number> {
  const res = await db().execute({
    sql: `SELECT value FROM app_settings WHERE key = 'display_lookahead_days'`,
    args: [],
  });
  const v = res.rows[0]?.value as string | undefined;
  const n = parseInt(v ?? "0", 10);
  return isNaN(n) ? 0 : n;
}

export async function setLookaheadDays(days: number): Promise<void> {
  await db().execute({
    sql: `
      INSERT INTO app_settings (key, value) VALUES ('display_lookahead_days', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `,
    args: [String(days)],
  });
}