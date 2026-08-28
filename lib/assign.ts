import { db } from "./db";
import { isoToLocalDate } from "./tz";

const DEPT_TO_DISPLAY: Record<string, string> = {
  "Big Screen": "bigscreen",
  "Broadcast": "broadcast",
};


export async function rebuildDisplays() {
  const shifts = (await db().execute(`SELECT sport, department, dtstart FROM shifts`)).rows;

  const groups = new Map<string, { sport: string; game_date: string; display_type: string; ics_start: string }>();
  for (const s of shifts) {
    const dept = s.department as string;
    const dt = DEPT_TO_DISPLAY[dept];
    if (!dt) continue;
    const sport = s.sport as string;
    const dtstart = s.dtstart as string;
    const date = isoToLocalDate(dtstart);
    const key = `${sport}|${date}|${dt}`;
    const existing = groups.get(key);
    if (!existing || dtstart < existing.ics_start) {
      groups.set(key, { sport, game_date: date, display_type: dt, ics_start: dtstart });
    }
  }

  const currentDisplays = (await db().execute(`SELECT sport, game_date, display_type FROM displays`)).rows;
  const stmts: { sql: string; args: (string | number | null)[] }[] = [];

  for (const d of currentDisplays) {
    if (d.display_type === "engineering") continue;  // ← add this
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

  // Synthetic "Engineering" display per date with engineering shifts
  const engDatesResult = await db().execute(`
    SELECT DISTINCT substr(dtstart, 1, 10) AS game_date
    FROM shifts
    WHERE department = 'Engineering'
  `);

  for (const row of engDatesResult.rows) {
    const gameDate = row.game_date as string;
    await db().execute({
      sql: `
        INSERT OR IGNORE INTO displays (sport, game_date, display_type, ics_start)
        VALUES ('Engineering', ?, 'engineering', ?)
      `,
      args: [gameDate, `${gameDate}T00:00:00.000Z`],
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

    const manuals = (await db().execute({
      sql: `SELECT a.control_room_id, a.display_id FROM assignments a
            WHERE a.game_date = ? AND a.manual = 1`,
      args: [gd],
    })).rows;
    const manualPanels = new Set(manuals.map(m => Number(m.control_room_id)));

    await db().execute({
      sql: `DELETE FROM assignments WHERE game_date = ? AND manual = 0`,
      args: [gd],
    });

    // Combo rule match (exclude engineering from sports key)
    const sportsKey = [...new Set(
      displays
        .filter((d) => d.display_type !== "engineering")
        .map((d) => d.sport as string)
    )].sort().join(",");
    const rule = (await db().execute({
      sql: `SELECT * FROM panel_combo_rules WHERE sports_key = ? ORDER BY priority ASC LIMIT 1`,
      args: [sportsKey],
    })).rows[0];

    let assigned = manuals.length;
    const assignedPanels = new Set(manualPanels);

    if (rule) {
      for (const panel of [1, 2, 3, 4]) {
        if (manualPanels.has(panel)) continue;
        const slot = rule[`panel_${panel}`] as string | null;
        if (!slot || slot === "none" || slot === "default") continue;
        const [sport, dt] = slot.split(":");
        const disp = displays.find(d => d.sport === sport && d.display_type === dt);
        if (!disp) continue;
        await db().execute({
          sql: `INSERT INTO assignments (display_id, control_room_id, game_date, manual) VALUES (?, ?, ?, 0)`,
          args: [Number(disp.id), panel, gd],
        });
        assignedPanels.add(panel);
        assigned++;
      }
    } else {
      // Fallback: fill panels 1..4 with non-engineering displays in order,
      // skipping panel 2 so it's free for engineering default.
      let panelIdx = 1;
      for (const disp of displays.filter((d) => d.display_type !== "engineering")) {
        while (panelIdx <= 4 && (assignedPanels.has(panelIdx) || panelIdx === 2)) {
          panelIdx++;
        }
        if (panelIdx > 4) break;
        await db().execute({
          sql: `INSERT INTO assignments (display_id, control_room_id, game_date, manual) VALUES (?, ?, ?, 0)`,
          args: [Number(disp.id), panelIdx, gd],
        });
        assignedPanels.add(panelIdx);
        assigned++;
        panelIdx++;
      }
    }

    // Default Panel 2 to engineering if it's free and an engineering display exists
    if (!assignedPanels.has(2)) {
      const engDisp = displays.find((d) => d.display_type === "engineering");
      if (engDisp) {
        await db().execute({
          sql: `INSERT INTO assignments (display_id, control_room_id, game_date, manual) VALUES (?, ?, ?, 0)`,
          args: [Number(engDisp.id), 2, gd],
        });
        assignedPanels.add(2);
        assigned++;
      }
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