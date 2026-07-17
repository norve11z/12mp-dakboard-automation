import { importIcs } from "@/lib/ics";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const result = await importIcs();
    return NextResponse.json({ ok: true, ...result });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}