import cron from "node-cron";
import { importIcs } from "./ics";
import { rebuildDisplays, autoAssign } from "./assign";
import db from "./db";
import { initDb } from "./init-db";

let started = false;

async function runImportCycle(label: string) {
  console.log(`[scheduler] ${label} starting…`);
  try {
    const imp = await importIcs();
    const disp = rebuildDisplays();
    const assigns = autoAssign();
    console.log(`[scheduler] ${label} done`, { imp, disp, assigns });
    return { ok: true, imp, disp, assigns };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[scheduler] ${label} failed:`, msg);
    initDb();
    db.prepare(`INSERT INTO import_logs (success, message, events_seen) VALUES (0, ?, 0)`).run(msg);
    return { ok: false, error: msg };
  }
}

export function startScheduler() {
  if (started) return;
  started = true;

  // 6:00 AM & 6:00 PM America/Chicago
  cron.schedule("0 6,18 * * *", () => runImportCycle("scheduled"), {
    timezone: "America/Chicago",
  });

  console.log("[scheduler] started (0 6,18 * * * America/Chicago)");
}

export async function runNow() {
  return runImportCycle("manual");
}