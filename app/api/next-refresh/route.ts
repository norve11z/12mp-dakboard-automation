import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await db().execute(`
      SELECT switch_at
      FROM scheduled_refreshes
      WHERE switch_at >= datetime('now')
        AND executed_at IS NULL
      ORDER BY switch_at ASC
      LIMIT 1
    `);

    const next = result.rows[0]?.switch_at as string | undefined;
    return NextResponse.json({ next: next ?? null });
  } catch (e) {
    return NextResponse.json(
      { next: null, error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}