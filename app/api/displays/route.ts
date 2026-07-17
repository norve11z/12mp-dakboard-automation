import db from "@/lib/db";
import { initDb } from "@/lib/init-db";
import { NextResponse } from "next/server";

export async function GET() {
  initDb();
  const rows = db.prepare(`
    SELECT d.*, a.control_room_id, a.manual
    FROM displays d
    LEFT JOIN assignments a ON a.display_id = d.id
    ORDER BY d.game_date, d.sport, d.display_type
  `).all();
  return NextResponse.json(rows);
}