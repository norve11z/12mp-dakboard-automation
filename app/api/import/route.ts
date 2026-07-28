import { importIcs } from "@/lib/ics";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const result = await importIcs();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
export async function GET() { return POST(); }