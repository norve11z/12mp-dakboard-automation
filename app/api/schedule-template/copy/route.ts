import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { from_sport, from_display_type, to_sport, to_display_type } = await req.json();
  if (!from_sport || !from_display_type || !to_sport || !to_display_type) {
    return NextResponse.json({ ok: false, error: "all fields required" }, { status: 400 });
  }

  const rows = (await db().execute({
    sql: `SELECT label, ref, offset_minutes FROM schedule_template WHERE sport=? AND display_type=?`,
    args: [from_sport, from_display_type],
  })).rows;

  if (rows.length === 0) return NextResponse.json({ ok: true, copied: 0 });

  await db().batch(rows.map(r => ({
    sql: `INSERT INTO schedule_template (sport, display_type, row_order, label, ref, offset_minutes)
          VALUES (?, ?, 0, ?, ?, ?)`,
    args: [to_sport, to_display_type, r.label as string, r.ref as string, Number(r.offset_minutes)],
  })));

  return NextResponse.json({ ok: true, copied: rows.length });
}