import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sport = url.searchParams.get("sport");
  const display_type = url.searchParams.get("display_type");
  if (!sport || !display_type) return NextResponse.json([]);

  const rows = (await db().execute({
    sql: `SELECT ics_position, short_label, display_order FROM position_map
          WHERE display_type = ? AND sport = ?
          ORDER BY display_order, ics_position`,
    args: [display_type, sport],
  })).rows;
  return NextResponse.json(rows);
}