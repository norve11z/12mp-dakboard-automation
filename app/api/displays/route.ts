import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const rows = (await db().execute(`
    SELECT d.*, a.control_room_id, a.manual
    FROM displays d
    LEFT JOIN assignments a ON a.display_id = d.id
    ORDER BY d.game_date, d.sport, d.display_type
  `)).rows;
  return NextResponse.json(rows);
}