import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { sport, display_type } = await req.json();
  if (!sport || !display_type) return NextResponse.json({ ok: false, error: "sport and display_type required" }, { status: 400 });
  if (sport === "*") return NextResponse.json({ ok: false, error: "cannot copy into Default" }, { status: 400 });

  const defaults = (await db().execute({
    sql: `SELECT ics_position, short_label, display_order FROM position_map WHERE sport = '*' AND display_type = ?`,
    args: [display_type],
  })).rows;

  if (defaults.length === 0) return NextResponse.json({ ok: true, copied: 0 });

  await db().batch(defaults.map(d => ({
    sql: `INSERT INTO position_map (sport, display_type, ics_position, short_label, display_order)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(sport, display_type, ics_position) DO NOTHING`,
    args: [sport, display_type, d.ics_position as string, d.short_label as string, Number(d.display_order)],
  })));

  return NextResponse.json({ ok: true, copied: defaults.length });
}