import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const rows = (await db().execute(`
    SELECT
      d.*,
      a.control_room_id,
      a.manual,
      (SELECT COUNT(*) FROM shifts s
        WHERE s.sport = d.sport
          AND s.department = CASE WHEN d.display_type = 'bigscreen' THEN 'Big Screen' ELSE 'Broadcast' END
          AND substr(s.dtstart, 1, 10) = d.game_date
      ) AS crew_count,
      (SELECT MIN(s.dtstart) FROM shifts s
        WHERE s.sport = d.sport
          AND s.department = CASE WHEN d.display_type = 'bigscreen' THEN 'Big Screen' ELSE 'Broadcast' END
          AND substr(s.dtstart, 1, 10) = d.game_date
      ) AS crew_call
    FROM displays d
    LEFT JOIN assignments a ON a.display_id = d.id
    ORDER BY d.game_date, d.sport, d.display_type
  `)).rows;
  return NextResponse.json(rows);
}