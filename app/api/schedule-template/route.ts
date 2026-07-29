import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const rows = (await db().execute(`
    SELECT * FROM schedule_template ORDER BY sport, display_type, ref, offset_minutes
  `)).rows;
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const { id, sport, display_type, label, ref, offset_minutes } = await req.json();
  if (!sport || !display_type || !label || !ref || offset_minutes === undefined) {
    return NextResponse.json({ ok: false, error: "all fields required" }, { status: 400 });
  }
  if (ref !== "crew_call" && ref !== "game_time") {
    return NextResponse.json({ ok: false, error: "ref must be crew_call or game_time" }, { status: 400 });
  }

  if (id) {
    await db().execute({
      sql: `UPDATE schedule_template SET sport=?, display_type=?, label=?, ref=?, offset_minutes=? WHERE id=?`,
      args: [sport, display_type, label, ref, Number(offset_minutes), id],
    });
  } else {
    await db().execute({
      sql: `INSERT INTO schedule_template (sport, display_type, row_order, label, ref, offset_minutes)
            VALUES (?, ?, 0, ?, ?, ?)`,
      args: [sport, display_type, label, ref, Number(offset_minutes)],
    });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
  await db().execute({ sql: `DELETE FROM schedule_template WHERE id = ?`, args: [id] });
  return NextResponse.json({ ok: true });
}