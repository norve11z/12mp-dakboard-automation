import ICAL from "ical.js";
import { db } from "./db";

const SUMMARY_RE = /^(.+?)\s*\(Shift as (.+?) at (.+?) at (.+?)\)\s*$/;
const IGNORED_DEPARTMENTS = new Set(["Post-Production", "Engineering"]);

const ALLOWED_SPORTS = new Set([
  "Football", "Baseball", "Softball",
  "Men's Basketball", "Women's Basketball",
  "Volleyball", "Soccer",
]);

export interface ParsedShift {
  uid: string;
  employee_name: string;
  position: string;
  sport: string;
  department: string;
  dtstart: string;
  dtend: string;
  location: string | null;
  description: string | null;
  raw_summary: string;
}

export function parseSummary(summary: string) {
  const m = summary.match(SUMMARY_RE);
  if (!m) return null;
  return {
    employee_name: m[1].trim(),
    position: m[2].trim(),
    sport: m[3].trim(),
    department: m[4].trim(),
  };
}

export async function importIcs(url?: string) {
  const icsUrl = url || process.env.ICS_URL;
  if (!icsUrl) throw new Error("ICS_URL not set");

  const res = await fetch(icsUrl);
  if (!res.ok) throw new Error(`Failed to fetch ICS: ${res.status}`);
  const text = await res.text();

  const jcal = ICAL.parse(text);
  const comp = new ICAL.Component(jcal);
  const vevents = comp.getAllSubcomponents("vevent");

  const errors: string[] = [];
  const rows: ParsedShift[] = [];
  let skipped = 0;

  for (const ve of vevents) {
    const ev = new ICAL.Event(ve);
    const summary = ev.summary || "";
    const parsed = parseSummary(summary);
    if (!parsed) { errors.push(`Unparseable: ${summary}`); skipped++; continue; }
    if (IGNORED_DEPARTMENTS.has(parsed.department)) { skipped++; continue; }
    if (!ALLOWED_SPORTS.has(parsed.sport)) { skipped++; continue; }

    rows.push({
      uid: ev.uid,
      employee_name: parsed.employee_name,
      position: parsed.position,
      sport: parsed.sport,
      department: parsed.department,
      dtstart: ev.startDate.toJSDate().toISOString(),
      dtend: ev.endDate.toJSDate().toISOString(),
      location: ev.location || null,
      description: ev.description || null,
      raw_summary: summary,
    });
  }

  const statements = rows.map(r => ({
    sql: `INSERT INTO shifts (uid, employee_name, position, sport, department, dtstart, dtend, location, description, raw_summary)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(uid) DO UPDATE SET
            employee_name = excluded.employee_name,
            position      = excluded.position,
            sport         = excluded.sport,
            department    = excluded.department,
            dtstart       = excluded.dtstart,
            dtend         = excluded.dtend,
            location      = excluded.location,
            description   = excluded.description,
            raw_summary   = excluded.raw_summary,
            imported_at   = datetime('now')`,
    args: [r.uid, r.employee_name, r.position, r.sport, r.department, r.dtstart, r.dtend, r.location, r.description, r.raw_summary],
  }));

  if (statements.length) await db().batch(statements);

  await db().execute({
    sql: `INSERT INTO import_logs (success, message, events_seen) VALUES (1, ?, ?)`,
    args: [`inserted=${rows.length} skipped=${skipped} errors=${errors.length}`, vevents.length],
  });

  return { inserted: rows.length, skipped, total: vevents.length, errors };
}