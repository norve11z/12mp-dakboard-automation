import { refreshSchedules } from "@/lib/espn";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const r = await refreshSchedules();
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
export async function GET() { return POST(); }