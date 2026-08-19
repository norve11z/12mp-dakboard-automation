import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await db().execute(`
      SELECT last_updated FROM pcr_state WHERE id = 1
    `);
    const lastUpdated = result.rows[0]?.last_updated as string | undefined;
    return NextResponse.json({ lastUpdated: lastUpdated ?? null });
  } catch (e) {
    return NextResponse.json(
      { lastUpdated: null, error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}