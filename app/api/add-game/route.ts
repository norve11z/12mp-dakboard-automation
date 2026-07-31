import { db } from "@/lib/db";
import { rebuildDisplays, autoAssign } from "@/lib/assign";
import { NextResponse } from "next/server";

interface CrewMember { position: string; name: string; }
interface Body {
  sport: string;
  game_date: string;         // YYYY-MM-DD
  display_type: "broadcast" | "bigscreen";
  crew_call: string;         // HH:MM (local)
  kickoff?: string | null;   // ISO or HH:MM
  opponent?: string | null;
  crew: CrewMember[];
}

function localIsoAt(date: string, hm: string): string {
  const [h, m] = hm.split(":").map(Number);
  const d = new Date(`${date}T00:00:00`);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

export async function POST(req: Request) {
  const b: Body = await req.json();
  if (!b.sport || !b.game_date || !b.display_type || !b.crew_call) {
    return NextResponse.json({ ok: false, error: "sport, game_date, display_type, crew_call required" }, { status: 400 });
  }

  const department = b.display_type === "bigscreen" ? "Big Screen" : "Broadcast";
  const start = localIsoAt(b.game_date, b.crew_call);
  const endD = new Date(start); endD.setHours(endD.getHours() + 6);
  const end = endD.toISOString();

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
    const kickoffIso = b.kickoff && b.kickoff.length <= 5
      ? localIsoAt(b.game_date, b.kickoff)
      : b.kickoff;
    await db().execute({
      sql: `INSERT INTO game_info (sport, game_date, opponent, kickoff, source)
            VALUES (?, ?, ?, ?, 'manual')
            ON CONFLICT(sport, game_date) DO UPDATE SET
              opponent = excluded.opponent,
              kickoff  = excluded.kickoff,
              source   = 'manual'`,
      args: [b.sport, b.game_date, b.opponent || null, kickoffIso || null],
    });
  }

  await rebuildDisplays();
  await autoAssign();
  return NextResponse.json({ ok: true, added: stmts.length });
}