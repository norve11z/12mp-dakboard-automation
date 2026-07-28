import { db } from "./db";

const DEPT_TO_DISPLAY: Record<string, string> = {
  "Big Screen": "bigscreen",
  "Broadcast": "broadcast",
};

function localDate(iso: string): string {
  const d = new Date(iso);
  const y = d.toLocaleString("en-CA", { timeZone: "America/Chicago", year: "numeric" });
  const m = d.toLocaleString("en-CA", { timeZone: "America/Chicago", month: "2-digit" });
  const day = d.toLocaleString("en-CA", { timeZone: "America/Chicago", day: "2-digit" });
  return `${y}-${m}-${day}`;
}

export async function rebuildDisplays() {
  const shifts = (await db().execute(`SELECT sport, department, dtstart FROM shifts`)).rows;

  const groups = new Map<string, { sport: string; game_date: string; display_type: string; ics_start: string }>();
  for (const s of shifts) {
    const dept = s.department as string;
    const dt = DEPT_TO_DISPLAY[dept];
    if (!dt) continue;
    const sport = s.sport as string;
    const dtstart = s.dtstart as string;
    const date = localDate(dtstart);
    const key = `${sport}|${date}|${dt}`;
    const existing = groups.get(key);
    if (!existing || dtstart < existing.ics_start) {
      groups.set(key, { sport, game_date: date, display_type: dt, ics_start: dtstart });
    }
  }

  const currentDisplays = (await db().execute(`SELECT sport, game_date, display_type FROM displays`)).rows;
  const stmts: { sql: string; args: (string | number | null)[] }[] = [];

  for (const d of currentDisplays) {
    const key = `${d.sport}|${d.game_date}|${d.display_type}`;
    if (!groups.has(key)) {
      stmts.push({
        sql: `DELETE FROM displays WHERE sport=? AND game_date=? AND display_type=?`,
        args: [d.sport as string, d.game_date as string, d.display_type as string],
      });
    }
  }

  for (const g of groups.values()) {
    stmts.push({
      sql: `INSERT INTO displays (sport, game_date, display_type, ics_start) VALUES (?, ?, ?, ?)
            ON CONFLICT(sport, game_date, display_type) DO UPDATE SET ics_start = excluded.ics_start`,
      args: [g.sport, g.game_date, g.display_type, g.ics_start],
    });
  }

  if (stmts.length) await db().batch(stmts);
  return { count: groups.size };
}

export async function autoAssign(date?: string) {
  const dates: string[] = date
    ? [date]
    : (await db().execute(`SELECT DISTINCT game_date FROM displays ORDER BY game_date`))
        .rows.map(r => r.game_date as string);

  const results: Record<string, { assigned: number; unassigned: number }> = {};

  for (const gd of dates) {
    const displays = (await db().execute({
      sql: `SELECT * FROM displays WHERE game_date = ? ORDER BY ics_start`,
      args: [gd],
    })).rows;
    const rules = (await db().execute(`SELECT * FROM assignment_rules ORDER BY priority ASC`)).rows;
    const manuals = (await db().execute({
      sql: `SELECT a.control_room_id, a.display_id, d.sport, d.display_type
            FROM assignments a JOIN displays d ON d.id = a.display_id
            WHERE a.game_date = ? AND a.manual = 1`,
      args: [gd],
    })).rows;

    const usedPanels = new Set<number>(manuals.map(m => Number(m.control_room_id)));
    const assignedDisplayIds = new Set<number>(manuals.map(m => Number(m.display_id)));

    await db().execute({
      sql: `DELETE FROM assignments WHERE game_date = ? AND manual = 0`,
      args: [gd],
    });

    let assigned = manuals.length;

    for (const d of displays) {
      const did = Number(d.id);
      if (assignedDisplayIds.has(did)) continue;
      const rule = rules.find(r => r.sport === d.sport && r.display_type === d.display_type);
      if (rule && !usedPanels.has(Number(rule.control_room_id))) {
        await db().execute({
          sql: `INSERT INTO assignments (display_id, control_room_id, game_date, manual) VALUES (?, ?, ?, 0)`,
          args: [did, Number(rule.control_room_id), gd],
        });
        usedPanels.add(Number(rule.control_room_id));
        assignedDisplayIds.add(did);
        assigned++;
      }
    }

    const remainingPanels = [1, 2, 3, 4].filter(p => !usedPanels.has(p));
    const remainingDisplays = displays.filter(d => !assignedDisplayIds.has(Number(d.id)));
    for (let i = 0; i < remainingDisplays.length && i < remainingPanels.length; i++) {
      await db().execute({
        sql: `INSERT INTO assignments (display_id, control_room_id, game_date, manual) VALUES (?, ?, ?, 0)`,
        args: [Number(remainingDisplays[i].id), remainingPanels[i], gd],
      });
      assigned++;
    }

    results[gd] = { assigned, unassigned: displays.length - assigned };
  }

  return results;
}

export async function manualAssign(displayId: number, controlRoomId: number) {
  const row = (await db().execute({
    sql: `SELECT * FROM displays WHERE id = ?`,
    args: [displayId],
  })).rows[0];
  if (!row) throw new Error("Display not found");
  const gd = row.game_date as string;

  await db().batch([
    { sql: `DELETE FROM assignments WHERE control_room_id = ? AND game_date = ?`, args: [controlRoomId, gd] },
    { sql: `DELETE FROM assignments WHERE display_id = ? AND game_date = ?`,     args: [displayId,     gd] },
    { sql: `INSERT INTO assignments (display_id, control_room_id, game_date, manual) VALUES (?, ?, ?, 1)`, args: [displayId, controlRoomId, gd] },
  ]);
  return { ok: true };
}

export async function clearAssignment(controlRoomId: number, date: string) {
  await db().execute({
    sql: `DELETE FROM assignments WHERE control_room_id = ? AND game_date = ?`,
    args: [controlRoomId, date],
  });
  return { ok: true };
}