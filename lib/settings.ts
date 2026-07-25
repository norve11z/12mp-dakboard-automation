import db from "./db";
import { initDb } from "./init-db";

export function getSetting(key: string): string | null {
  initDb();
  const row = db.prepare(`SELECT value FROM app_settings WHERE key = ?`).get(key) as { value: string | null } | undefined;
  return row?.value ?? null;
}

export function setSetting(key: string, value: string | null): void {
  initDb();
  db.prepare(`
    INSERT INTO app_settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(key, value);
}

/** Returns the effective display date: override if set, else today (America/Chicago). */
export function getDisplayDate(): string {
  const override = getSetting("display_date_override");
  if (override) return override;
  const d = new Date();
  const y = d.toLocaleString("en-CA", { timeZone: "America/Chicago", year: "numeric" });
  const m = d.toLocaleString("en-CA", { timeZone: "America/Chicago", month: "2-digit" });
  const day = d.toLocaleString("en-CA", { timeZone: "America/Chicago", day: "2-digit" });
  return `${y}-${m}-${day}`;
}