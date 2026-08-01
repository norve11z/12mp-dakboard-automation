import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const rows = (await db().execute(`
    SELECT DISTINCT sport, department, position
    FROM shifts
    WHERE department IN ('Broadcast', 'Big Screen')
  `)).rows;
  return NextResponse.json(rows);
}