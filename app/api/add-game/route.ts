import { db } from "@/lib/db";
import { rebuildDisplays, autoAssign } from "@/lib/assign";
import { chicagoWallToIso } from "@/lib/tz";
import { NextResponse } from "next/server";

interface CrewMember { position: string; name: string; }
interface Body {
  sport: string;
  game_date: string;
  display_type: "broadcast" | "bigscreen";
  crew_call: string;
  kickoff?: string | null;
  opponent?: string | null;
  crew: CrewMember[];
}

export async function POST(req: Request) {
  const b: Body = await req.json();
  if (!b.sport || !b.game_date || !b.display_type || !b.crew_call) {
    return NextResponse.json({ ok: false, error: "sport, game_date, display_type, crew_call required" }, { status: 400 });
  }

  const department = b.display_type === "bigscreen" ? "Big Screen" : "Broadcast";
  const start = chicagoWallToIso(b.game_date, b.crew_call);
  const end = new Date(new Date(start).getTime() + 6 * 3600 * 1000).toISOString();

  const stamp = Date.now();
  const stmts = b.crew.map((c, i) => ({
    sql: `INSERT INTO shifts (uid, employee_name, position, sport, department, dtstart, dtend, location, description, raw_summary)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      `SEED-${stamp}-${i}`,
      c.name, c.position, b.sport, department,
      start, end, b.sport, "seeded",
      `${c.name} (Shift as ${c.position} at ${b.sport} at ${department})`,
    ],
  }));
  if (stmts.length) await db().batch(stmts);

  if (b.opponent || b.kickoff) {
    const kickoffIso = b.kickoff && /^\d{1,2}:\d{2}$/.test(b.kickoff)
      ? chicagoWallToIso(b.game_date, b.kickoff)
      : b.kickoff || null;
    await db().execute({
      sql: `INSERT INTO game_info (sport, game_date, opponent, kickoff, source)
            VALUES (?, ?, ?, ?, 'manual')
            ON CONFLICT(sport, game_date) DO UPDATE SET
              opponent = excluded.opponent,
              kickoff  = excluded.kickoff,
              source   = 'manual'`,
      args: [b.sport, b.game_date, b.opponent || null, kickoffIso],
    });
  }

  await rebuildDisplays();
  await autoAssign();
  return NextResponse.json({ ok: true, added: stmts.length });
}