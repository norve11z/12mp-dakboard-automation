import { getLookaheadDays, setLookaheadDays } from "@/lib/settings";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const days = await getLookaheadDays();
  return NextResponse.json({ days });
}

export async function POST(req: Request) {
  const body = await req.json();
  const days = Number(body.days);
  if (![0, 1, 3, 7].includes(days)) {
    return NextResponse.json({ ok: false, error: "invalid days" }, { status: 400 });
  }
  await setLookaheadDays(days);
  return NextResponse.json({ ok: true });
}