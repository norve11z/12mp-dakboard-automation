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
  const override = await getSetting("display_date_override");
  return override || todayLocal();
}