import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const rows = (await db().execute(`SELECT * FROM position_map ORDER BY sport, display_type, display_order, ics_position`)).rows;
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const { id, sport, display_type, ics_position, short_label, display_order } = await req.json();
  if (!sport || !display_type || !ics_position || !short_label || display_order === undefined) {
    return NextResponse.json({ ok: false, error: "all fields required" }, { status: 400 });
  }

  if (id) {
    await db().execute({
      sql: `UPDATE position_map SET sport=?, display_type=?, ics_position=?, short_label=?, display_order=? WHERE id=?`,
      args: [sport, display_type, ics_position, short_label, Number(display_order), id],
    });
  } else {
    await db().execute({
      sql: `INSERT INTO position_map (sport, display_type, ics_position, short_label, display_order)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(sport, display_type, ics_position) DO UPDATE SET
              short_label = excluded.short_label,
              display_order = excluded.display_order`,
      args: [sport, display_type, ics_position, short_label, Number(display_order)],
    });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
  await db().execute({ sql: `DELETE FROM position_map WHERE id = ?`, args: [id] });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  const { orders } = await req.json() as { orders: { id: number; display_order: number }[] };
  if (!Array.isArray(orders)) return NextResponse.json({ ok: false, error: "orders array required" }, { status: 400 });
  await db().batch(orders.map(o => ({
    sql: `UPDATE position_map SET display_order = ? WHERE id = ?`,
    args: [o.display_order, o.id],
  })));
  return NextResponse.json({ ok: true });
}