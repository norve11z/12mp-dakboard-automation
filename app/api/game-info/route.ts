import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const rows = (await db().execute(`SELECT * FROM game_info ORDER BY game_date`)).rows;
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const { sport, game_date, opponent, kickoff, notes, source } = await req.json();
  if (!sport || !game_date) return NextResponse.json({ ok: false, error: "sport and game_date required" }, { status: 400 });
  await db().execute({
    sql: `INSERT INTO game_info (sport, game_date, opponent, kickoff, notes, source)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(sport, game_date) DO UPDATE SET
            opponent = excluded.opponent, kickoff = excluded.kickoff,
            notes = excluded.notes, source = excluded.source`,
    args: [sport, game_date, opponent || null, kickoff || null, notes || null, source || "manual"],
  });
  return NextResponse.json({ ok: true });
}