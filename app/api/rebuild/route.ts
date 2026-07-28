import { rebuildDisplays, autoAssign } from "@/lib/assign";
import { NextResponse } from "next/server";

export async function POST() {
  const displays = await rebuildDisplays();
  const assignments = await autoAssign();
  return NextResponse.json({ ok: true, displays, assignments });
}
export async function GET() { return POST(); }