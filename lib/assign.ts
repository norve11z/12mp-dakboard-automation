import db from "./db";
import { initDb } from "./init-db";

// Maps ICS department → display_type
const DEPT_TO_DISPLAY: Record<string, string> = {
  "Big Screen": "bigscreen",
  "Broadcast": "broadcast",
};

interface ShiftRow {
  sport: string;
  department: string;
  dtstart: string;
}

interface DisplayRow {
  id: number;
  sport: string;
  game_date: string;
  display_type: string;
  ics_start: string;
}

interface RuleRow {
  sport: string;
  display_type: string;
  control_room_id: number;
  priority: number;
}

function localDate(iso: string): string {
  // YYYY-MM-DD in America/Chicago (env TZ)
  const d = new Date(iso);
  const y = d.toLocaleString("en-CA", { timeZone: "America/Chicago", year: "numeric" });
  const m = d.toLocaleString("en-CA", { timeZone: "America/Chicago", month: "2-digit" });
  const day = d.toLocaleString("en-CA", { timeZone: "America/Chicago", day: "2-digit" });
  return `${y}-${m}-${day}`;
}

/** Rebuild displays table from current shifts. */
export function rebuildDisplays() {
  initDb();

  const shifts = db.prepare(`
    SELECT sport, department, dtstart FROM shifts
  `).all() as ShiftRow[];

  // Group: key = sport|date|display_type -> earliest dtstart
  const groups = new Map<string, { sport: string; game_date: string; display_type: string; ics_start: string }>();

  for (const s of shifts) {
    const dt = DEPT_TO_DISPLAY[s.department];
    if (!dt) continue;
    const date = localDate(s.dtstart);
    const key = `${s.sport}|${date}|${dt}`;
    const existing = groups.get(key);
    if (!existing || s.dtstart < existing.ics_start) {
      groups.set(key, { sport: s.sport, game_date: date, display_type: dt, ics_start: s.dtstart });
    }
  }

  const upsert = db.prepare(`
    INSERT INTO displays (sport, game_date, display_type, ics_start)
    VALUES (@sport, @game_date, @display_type, @ics_start)
    ON CONFLICT(sport, game_date, display_type) DO UPDATE SET
      ics_start = excluded.ics_start
  `);

  // Remove stale displays (no shifts anymore)
  const existingKeys = new Set<string>();
  const currentDisplays = db.prepare(`SELECT sport, game_date, display_type FROM displays`).all() as { sport: string; game_date: string; display_type: string }[];
  for (const d of currentDisplays) existingKeys.add(`${d.sport}|${d.game_date}|${d.display_type}`);
  for (const key of existingKeys) {
    if (!groups.has(key)) {
      const [sport, game_date, display_type] = key.split("|");
      db.prepare(`DELETE FROM displays WHERE sport=? AND game_date=? AND display_type=?`).run(sport, game_date, display_type);
    }
  }

  const tx = db.transaction(() => {
    for (const g of groups.values()) upsert.run(g);
  });
  tx();

  return { count: groups.size };
}

/** Auto-assign displays to panels for a given date. Skips slots that have manual assignments. */
export function autoAssign(date?: string) {
  initDb();

  // If no date given, run for every date with displays
  const dates = date
    ? [date]
    : (db.prepare(`SELECT DISTINCT game_date FROM displays ORDER BY game_date`).all() as { game_date: string }[]).map(r => r.game_date);

  const results: Record<string, { assigned: number; unassigned: number }> = {};

  for (const gd of dates) {
    const displays = db.prepare(`SELECT * FROM displays WHERE game_date = ? ORDER BY ics_start`).all(gd) as DisplayRow[];
    const rules = db.prepare(`SELECT * FROM assignment_rules ORDER BY priority ASC`).all() as RuleRow[];

    // Preserve manual assignments for this date
    const manuals = db.prepare(`
      SELECT a.*, d.sport, d.display_type FROM assignments a
      JOIN displays d ON d.id = a.display_id
      WHERE a.game_date = ? AND a.manual = 1
    `).all(gd) as (DisplayRow & { control_room_id: number; display_id: number })[];

    const usedPanels = new Set<number>(manuals.map(m => m.control_room_id));
    const assignedDisplayIds = new Set<number>(manuals.map(m => m.display_id));

    // Clear auto assignments for this date
    db.prepare(`DELETE FROM assignments WHERE game_date = ? AND manual = 0`).run(gd);

    let assigned = manuals.length;

    // Pass 1: rule-based
    for (const d of displays) {
      if (assignedDisplayIds.has(d.id)) continue;
      const rule = rules.find(r => r.sport === d.sport && r.display_type === d.display_type);
      if (rule && !usedPanels.has(rule.control_room_id)) {
        db.prepare(`
          INSERT INTO assignments (display_id, control_room_id, game_date, manual)
          VALUES (?, ?, ?, 0)
        `).run(d.id, rule.control_room_id, gd);
        usedPanels.add(rule.control_room_id);
        assignedDisplayIds.add(d.id);
        assigned++;
      }
    }

    // Pass 2: fill remaining panels with remaining displays
    const remainingPanels = [1, 2, 3, 4].filter(p => !usedPanels.has(p));
    const remainingDisplays = displays.filter(d => !assignedDisplayIds.has(d.id));
    for (let i = 0; i < remainingDisplays.length && i < remainingPanels.length; i++) {
      db.prepare(`
        INSERT INTO assignments (display_id, control_room_id, game_date, manual)
        VALUES (?, ?, ?, 0)
      `).run(remainingDisplays[i].id, remainingPanels[i], gd);
      assigned++;
    }

    results[gd] = { assigned, unassigned: displays.length - assigned };
  }

  return results;
}

/** Manual assignment: assigns display to panel, marks manual. Removes existing assignment on that panel. */
export function manualAssign(displayId: number, controlRoomId: number) {
  initDb();
  const disp = db.prepare(`SELECT * FROM displays WHERE id = ?`).get(displayId) as DisplayRow | undefined;
  if (!disp) throw new Error("Display not found");

  db.prepare(`DELETE FROM assignments WHERE control_room_id = ? AND game_date = ?`).run(controlRoomId, disp.game_date);
  db.prepare(`DELETE FROM assignments WHERE display_id = ? AND game_date = ?`).run(displayId, disp.game_date);
  db.prepare(`
    INSERT INTO assignments (display_id, control_room_id, game_date, manual)
    VALUES (?, ?, ?, 1)
  `).run(displayId, controlRoomId, disp.game_date);

  return { ok: true };
}

/** Clear a manual assignment (revert to auto). */
export function clearAssignment(controlRoomId: number, date: string) {
  initDb();
  db.prepare(`DELETE FROM assignments WHERE control_room_id = ? AND game_date = ?`).run(controlRoomId, date);
  return { ok: true };
}