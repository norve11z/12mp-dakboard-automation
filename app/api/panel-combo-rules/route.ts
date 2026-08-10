import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const rows = (await db().execute(`SELECT * FROM panel_combo_rules ORDER BY priority, name`)).rows;
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const { id, name, sports_key, priority, panel_1, panel_2, panel_3, panel_4 } = await req.json();
  if (!name || !sports_key) return NextResponse.json({ ok: false, error: "name + sports_key required" }, { status: 400 });
  if (id) {
    await db().execute({
      sql: `UPDATE panel_combo_rules SET name=?, sports_key=?, priority=?, panel_1=?, panel_2=?, panel_3=?, panel_4=? WHERE id=?`,
      args: [name, sports_key, Number(priority || 100), panel_1 || null, panel_2 || null, panel_3 || null, panel_4 || null, id],
    });
  } else {
    await db().execute({
      sql: `INSERT INTO panel_combo_rules (name, sports_key, priority, panel_1, panel_2, panel_3, panel_4)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(sports_key) DO UPDATE SET
              name=excluded.name, priority=excluded.priority,
              panel_1=excluded.panel_1, panel_2=excluded.panel_2,
              panel_3=excluded.panel_3, panel_4=excluded.panel_4`,
      args: [name, sports_key, Number(priority || 100), panel_1 || null, panel_2 || null, panel_3 || null, panel_4 || null],
    });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  await db().execute({ sql: `DELETE FROM panel_combo_rules WHERE id = ?`, args: [id] });
  return NextResponse.json({ ok: true });
}