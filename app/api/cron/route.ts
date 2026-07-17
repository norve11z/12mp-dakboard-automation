import { runNow } from "@/lib/scheduler";
import { NextResponse } from "next/server";

export async function POST() {
  const r = await runNow();
  return NextResponse.json(r);
}
export async function GET() { return POST(); }