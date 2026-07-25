import db from "@/lib/db";
import { initDb } from "@/lib/init-db";
import { NextResponse } from "next/server";

export async function GET() {
  initDb();
  const rows = db.prepare(`
    SELECT * FROM position_map
    ORDER BY sport, display_type, display_order, ics_position
  `).all();
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  initDb();
  const { id, sport, display_type, ics_position, short_label, display_order } = await req.json();
  if (!sport || !display_type || !ics_position || !short_label || display_order === undefined) {
    return NextResponse.json({ ok: false, error: "all fields required" }, { status: 400 });
  }

  if (id) {
    db.prepare(`
      UPDATE position_map SET
        sport = ?, display_type = ?, ics_position = ?, short_label = ?, display_order = ?
      WHERE id = ?
    `).run(sport, display_type, ics_position, short_label, Number(display_order), id);
  } else {
    db.prepare(`
      INSERT INTO position_map (sport, display_type, ics_position, short_label, display_order)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(sport, display_type, ics_position) DO UPDATE SET
        short_label = excluded.short_label,
        display_order = excluded.display_order
    `).run(sport, display_type, ics_position, short_label, Number(display_order));
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  initDb();
  const { id } = await req.json();
  if (!id) return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
  db.prepare(`DELETE FROM position_map WHERE id = ?`).run(id);
  return NextResponse.json({ ok: true });
}


export async function PATCH(req: Request) {
  initDb();
  const { orders } = await req.json() as { orders: { id: number; display_order: number }[] };
  if (!Array.isArray(orders)) {
    return NextResponse.json({ ok: false, error: "orders array required" }, { status: 400 });
  }
  const stmt = db.prepare(`UPDATE position_map SET display_order = ? WHERE id = ?`);
  const tx = db.transaction((list: typeof orders) => {
    for (const o of list) stmt.run(o.display_order, o.id);
  });
  tx(orders);
  return NextResponse.json({ ok: true });
}