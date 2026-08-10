import { db } from "@/lib/db";
import { todayLocal } from "@/lib/tz";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const results = await db().batch([
    {
      sql: `
        SELECT
          d.*,
          a.control_room_id,
          a.manual,
          COUNT(s.uid) AS crew_count,
          MIN(s.dtstart) AS crew_call
        FROM displays d
        LEFT JOIN assignments a
          ON a.display_id = d.id
        LEFT JOIN shifts s
          ON s.sport = d.sport
          AND s.department =
            CASE
              WHEN d.display_type = 'bigscreen'
              THEN 'Big Screen'
              ELSE 'Broadcast'
            END
          AND substr(s.dtstart, 1, 10) = d.game_date
        GROUP BY d.id, a.control_room_id, a.manual
        ORDER BY d.game_date, d.sport, d.display_type
      `,
      args: [],
    },
    {
      sql: `SELECT * FROM game_info ORDER BY game_date`,
      args: [],
    },
    {
      sql: `SELECT COUNT(*) AS shifts FROM shifts`,
      args: [],
    },
    {
      sql: `
        SELECT COUNT(*) AS seed
        FROM shifts
        WHERE uid LIKE 'SEED-%'
      `,
      args: [],
    },
    {
      sql: `
        SELECT ran_at
        FROM import_logs
        ORDER BY id DESC
        LIMIT 1
      `,
      args: [],
    },
    {
      sql: `
        SELECT value
        FROM app_settings
        WHERE key = 'display_date_override'
      `,
      args: [],
    },
  ]);

  return NextResponse.json({
    displays: results[0].rows,
    games: results[1].rows,

    stats: {
      shifts: Number(results[2].rows[0]?.shifts ?? 0),
      seed: Number(results[3].rows[0]?.seed ?? 0),
      lastImport:
        (results[4].rows[0]?.ran_at as string) ?? null,
    },

    display_date_override:
      (results[5].rows[0]?.value as string) || null,

    today: todayLocal(),
  }, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}