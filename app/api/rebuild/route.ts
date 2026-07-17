import { rebuildDisplays, autoAssign } from "@/lib/assign";
import { NextResponse } from "next/server";

export async function POST() {
  const displays = rebuildDisplays();
  const assignments = autoAssign();
  return NextResponse.json({ ok: true, displays, assignments });
}

export async function GET() { return POST(); }