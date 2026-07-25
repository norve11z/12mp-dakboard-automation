import db from "@/lib/db";
import { initDb } from "@/lib/init-db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  initDb();
  const { sport, display_type } = await req.json();
  if (!sport || !display_type) {
    return NextResponse.json({ ok: false, error: "sport and display_type required" }, { status: 400 });
  }
  if (sport === "*") {
    return NextResponse.json({ ok: false, error: "cannot copy into Default" }, { status: 400 });
  }

  const defaults = db.prepare(`
    SELECT ics_position, short_label, display_order FROM position_map
    WHERE sport = '*' AND display_type = ?
  `).all(display_type) as { ics_position: string; short_label: string; display_order: number }[];

  const stmt = db.prepare(`
    INSERT INTO position_map (sport, display_type, ics_position, short_label, display_order)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(sport, display_type, ics_position) DO NOTHING
  `);

  const tx = db.transaction(() => {
    for (const d of defaults) {
      stmt.run(sport, display_type, d.ics_position, d.short_label, d.display_order);
    }
  });
  tx();

  return NextResponse.json({ ok: true, copied: defaults.length });
}