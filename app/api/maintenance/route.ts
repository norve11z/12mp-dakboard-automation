import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { action, days } = await req.json();

  if (action === "clear-seed") {
    const r = await db().execute(`DELETE FROM shifts WHERE uid LIKE 'SEED-%'`);
    return NextResponse.json({ ok: true, deleted: r.rowsAffected });
  }

  if (action === "clear-old") {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - Number(days || 7));
    const iso = cutoff.toISOString();
    const r = await db().execute({
      sql: `DELETE FROM shifts WHERE dtstart < ?`,
      args: [iso],
    });
    return NextResponse.json({ ok: true, deleted: r.rowsAffected, cutoff: iso });
  }

  if (action === "clear-all") {
    const r = await db().execute(`DELETE FROM shifts`);
    await db().execute(`DELETE FROM displays`);
    await db().execute(`DELETE FROM assignments`);
    return NextResponse.json({ ok: true, deleted: r.rowsAffected });
  }

  if (action === "stats") {
    const shifts = (await db().execute(`SELECT COUNT(*) AS n FROM shifts`)).rows[0].n;
    const seed   = (await db().execute(`SELECT COUNT(*) AS n FROM shifts WHERE uid LIKE 'SEED-%'`)).rows[0].n;
    const last   = (await db().execute(`SELECT ran_at FROM import_logs ORDER BY id DESC LIMIT 1`)).rows[0];
    return NextResponse.json({ ok: true, shifts, seed, lastImport: last?.ran_at ?? null });
  }

  return NextResponse.json({ ok: false, error: "unknown action" }, { status: 400 });
}