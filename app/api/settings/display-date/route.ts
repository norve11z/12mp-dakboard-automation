import { getSetting, setSetting } from "@/lib/settings";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ display_date_override: getSetting("display_date_override") });
}

export async function POST(req: Request) {
  const { date } = await req.json();
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ ok: false, error: "date must be YYYY-MM-DD or null" }, { status: 400 });
  }
  setSetting("display_date_override", date || null);
  return NextResponse.json({ ok: true, display_date_override: date || null });
}

export async function DELETE() {
  setSetting("display_date_override", null);
  return NextResponse.json({ ok: true });
}