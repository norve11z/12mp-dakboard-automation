import { autoAssign } from "@/lib/assign";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { date } = await req.json();

    if (!date) {
      return NextResponse.json(
        { ok: false, error: "date required" },
        { status: 400 }
      );
    }

    // Remove ALL existing assignments for this date.
    // This includes both manual and automatic assignments.
    await db().execute({
      sql: `DELETE FROM assignments WHERE game_date = ?`,
      args: [String(date)],
    });

    // Rebuild the assignments using the normal automatic rules.
    const result = await autoAssign(String(date));

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (err) {
    console.error("Reset to auto failed:", err);

    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Reset to auto failed",
      },
      { status: 500 }
    );
  }
}