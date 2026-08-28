import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const database = db();

    const result = await database.execute(`
      SELECT id, switch_at
      FROM scheduled_refreshes
      WHERE switch_at <= datetime('now')
        AND switch_at >= datetime('now', '-10 minutes')
        AND executed_at IS NULL
      ORDER BY switch_at ASC
      LIMIT 1
    `);

    const row = result.rows[0];

    if (!row) {
      return NextResponse.json({ next: null });
    }

    const id = row.id;
    const switchAt = row.switch_at;

    // Mark this refresh as executed before telling the browser to reload.
    await database.execute({
      sql: `
        UPDATE scheduled_refreshes
        SET executed_at = datetime('now')
        WHERE id = ?
          AND executed_at IS NULL
      `,
      args: [id],
    });

    return NextResponse.json({
      next: switchAt,
    });
  } catch (e) {
    return NextResponse.json(
      {
        next: null,
        error: e instanceof Error ? e.message : String(e),
      },
      { status: 500 }
    );
  }
}
