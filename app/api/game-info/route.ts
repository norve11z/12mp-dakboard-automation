import db from "@/lib/db";
import { initDb } from "@/lib/init-db";
import { NextResponse } from "next/server";

export async function GET() {
  initDb();
  const rows = db.prepare(`SELECT * FROM game_info ORDER BY game_date`).all();
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  initDb();
  const { sport, game_date, opponent, kickoff, notes } = await req.json();
  if (!sport || !game_date) {
    return NextResponse.json({ ok: false, error: "sport and game_date required" }, { status: 400 });
  }
  db.prepare(`
    INSERT INTO game_info (sport, game_date, opponent, kickoff, notes)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(sport, game_date) DO UPDATE SET
      opponent = excluded.opponent,
      kickoff  = excluded.kickoff,
      notes    = excluded.notes
  `).run(sport, game_date, opponent || null, kickoff || null, notes || null);
  return NextResponse.json({ ok: true });
}